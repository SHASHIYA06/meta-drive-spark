const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
const { Storage } = require('@google-cloud/storage');

class VertexRAG {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.location = process.env.VERTEX_AI_LOCATION || 'us-central1';
    
    // Initialize credentials from JSON string
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      this.predictionClient = new PredictionServiceClient({ credentials });
      this.documentClient = new DocumentProcessorServiceClient({ credentials });
      this.storage = new Storage({ credentials });
    } else {
      this.predictionClient = new PredictionServiceClient();
      this.documentClient = new DocumentProcessorServiceClient();
      this.storage = new Storage();
    }

    this.bucketName = `${this.projectId}-kmrcl-docs`;
    this.processorId = process.env.VERTEX_PROCESSOR_ID;
  }

  async initialize() {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();
      if (!exists) {
        await this.storage.createBucket(this.bucketName, {
          location: this.location,
          storageClass: 'STANDARD',
        });
        console.log(`✅ Created bucket: ${this.bucketName}`);
      }
    } catch (error) {
      console.warn('⚠️ Bucket creation skipped:', error.message);
    }
  }

  /**
   * Enhanced OCR with Vertex AI Document AI
   * Supports circuit drawings, technical diagrams, and scanned documents
   */
  async processDocument(filePath, mimeType) {
    try {
      const fs = require('fs').promises;
      const fileContent = await fs.readFile(filePath);
      const encodedContent = fileContent.toString('base64');

      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
      
      const request = {
        name,
        rawDocument: {
          content: encodedContent,
          mimeType: mimeType || 'application/pdf',
        },
        skipHumanReview: true,
      };

      const [result] = await this.documentClient.processDocument(request);
      const { document } = result;

      // Extract text
      const text = document.text || '';

      // Extract tables
      const tables = this.extractTables(document);

      // Extract entities (for technical specs)
      const entities = this.extractEntities(document);

      return {
        text,
        tables,
        entities,
        confidence: document.pages?.[0]?.blocks?.[0]?.layout?.confidence || 0,
      };
    } catch (error) {
      console.error('❌ Vertex AI OCR error:', error);
      throw error;
    }
  }

  extractTables(document) {
    const tables = [];
    
    if (!document.pages) return tables;

    for (const page of document.pages) {
      if (!page.tables) continue;

      for (const table of page.tables) {
        const tableData = {
          rows: [],
        };

        for (const row of table.bodyRows || []) {
          const rowData = [];
          for (const cell of row.cells || []) {
            const cellText = this.getTextFromLayout(cell.layout, document.text);
            rowData.push(cellText);
          }
          tableData.rows.push(rowData);
        }

        if (table.headerRows) {
          const headers = [];
          for (const cell of table.headerRows[0].cells || []) {
            const cellText = this.getTextFromLayout(cell.layout, document.text);
            headers.push(cellText);
          }
          tableData.headers = headers;
        }

        tables.push(tableData);
      }
    }

    return tables;
  }

  extractEntities(document) {
    const entities = [];
    
    if (!document.entities) return entities;

    for (const entity of document.entities) {
      entities.push({
        type: entity.type,
        value: entity.mentionText,
        confidence: entity.confidence,
      });
    }

    return entities;
  }

  getTextFromLayout(layout, fullText) {
    if (!layout || !layout.textAnchor || !layout.textAnchor.textSegments) {
      return '';
    }

    const segments = layout.textAnchor.textSegments;
    let text = '';

    for (const segment of segments) {
      const startIndex = parseInt(segment.startIndex || 0);
      const endIndex = parseInt(segment.endIndex || 0);
      text += fullText.substring(startIndex, endIndex);
    }

    return text.trim();
  }

  /**
   * Generate embeddings using Vertex AI text-embedding model
   */
  async generateEmbedding(text) {
    try {
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/text-embedding-004`;

      const request = {
        endpoint,
        instances: [{ content: text }],
      };

      const [response] = await this.predictionClient.predict(request);
      const embedding = response.predictions[0].embeddings.values;

      return embedding;
    } catch (error) {
      console.error('❌ Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Batch generate embeddings
   */
  async generateEmbeddingsBatch(texts) {
    try {
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/text-embedding-004`;

      const instances = texts.map(text => ({ content: text }));

      const request = {
        endpoint,
        instances,
      };

      const [response] = await this.predictionClient.predict(request);
      const embeddings = response.predictions.map(p => p.embeddings.values);

      return embeddings;
    } catch (error) {
      console.error('❌ Batch embedding error:', error);
      throw error;
    }
  }

  /**
   * Generate AI response using Vertex AI Gemini
   */
  async generateResponse(prompt, context) {
    try {
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.0-flash`;

      const fullPrompt = `Context:\n${context}\n\nQuestion: ${prompt}\n\nInstructions:
- Answer concisely using ONLY the provided context
- Use HTML formatting (<strong>, <ul>, <li>, <table>, etc.)
- Include inline citations like [1], [2]
- If context contains tables, use HTML <table>
- If you cannot answer from context, say so clearly

Answer:`;

      const request = {
        endpoint,
        instances: [
          {
            content: fullPrompt,
          },
        ],
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 40,
        },
      };

      const [response] = await this.predictionClient.predict(request);
      const answer = response.predictions[0].content;

      return answer;
    } catch (error) {
      console.error('❌ Response generation error:', error);
      throw error;
    }
  }

  /**
   * Upload file to Cloud Storage for processing
   */
  async uploadFile(filePath, fileName) {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const destination = `uploads/${Date.now()}-${fileName}`;
      
      await bucket.upload(filePath, {
        destination,
        metadata: {
          contentType: 'application/octet-stream',
        },
      });

      return `gs://${this.bucketName}/${destination}`;
    } catch (error) {
      console.error('❌ File upload error:', error);
      throw error;
    }
  }
}

module.exports = VertexRAG;
