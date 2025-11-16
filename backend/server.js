require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const sharp = require('sharp');

const VectorStore = require('./vectorStore');
const EmbedQueue = require('./embedQueue');
const JobManager = require('./jobManager');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configuration
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 1200;
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP) || 200;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 8;
const USE_VERTEX_AI = process.env.GOOGLE_CLOUD_PROJECT ? true : false;

console.log('🔧 Configuration:');
console.log('  - Vertex AI:', USE_VERTEX_AI ? 'ENABLED' : 'DISABLED');
console.log('  - Port:', PORT);
console.log('  - Chunk Size:', CHUNK_SIZE);
console.log('  - Batch Size:', BATCH_SIZE);

// Initialize services
const vectorStore = new VectorStore();
const embedQueue = new EmbedQueue(process.env.GEMINI_API_KEY, BATCH_SIZE);
const jobManager = new JobManager();

// Optional: Load Vertex AI only if configured
let vertexRAG = null;
if (USE_VERTEX_AI) {
  try {
    const VertexRAG = require('./vertexRag');
    vertexRAG = new VertexRAG();
    await vertexRAG.initialize();
    console.log('✅ Vertex AI RAG initialized');
  } catch (error) {
    console.error('⚠️ Vertex AI not available:', error.message);
  }
}

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: '50mb' }));

// Clean old jobs periodically
setInterval(() => jobManager.cleanOldJobs(), 300000); // Every 5 minutes

// Utility: Smart chunking
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length < chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = para;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);

  // Apply overlap
  const overlappedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];
    if (i > 0 && overlap > 0) {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-overlap);
      chunk = overlapText + ' ' + chunk;
    }
    overlappedChunks.push(chunk);
  }

  return overlappedChunks;
}

// Enhanced OCR with image pre-processing
async function extractImageOCR(filePath) {
  try {
    // Pre-process image for better OCR with multiple strategies
    const strategies = [
      { name: 'default', threshold: 128 },
      { name: 'circuit', threshold: 120 },
      { name: 'text', threshold: 160 },
    ];

    let bestResult = null;
    let highestConfidence = 0;

    for (const strategy of strategies) {
      try {
        const processedPath = `${filePath}_${strategy.name}.png`;
        await sharp(filePath)
          .greyscale()
          .normalize()
          .threshold(strategy.threshold)
          .sharpen()
          .median(3)
          .toFile(processedPath);

        const result = await Tesseract.recognize(processedPath, 'eng', {
          logger: info => {
            if (info.status === 'recognizing text') {
              console.log(`OCR (${strategy.name}): ${Math.round(info.progress * 100)}%`);
            }
          }
        });

        await fs.unlink(processedPath).catch(() => {});

        if (result.data.confidence > highestConfidence) {
          highestConfidence = result.data.confidence;
          bestResult = result;
        }

        // Stop if we get high confidence
        if (highestConfidence > 85) break;
      } catch (err) {
        console.error(`Strategy ${strategy.name} failed:`, err.message);
      }
    }

    if (bestResult) {
      console.log(`✅ OCR complete (confidence: ${Math.round(highestConfidence)}%)`);
      return bestResult.data.text;
    }

    // Final fallback to original image
    console.log('⚠️ Using fallback OCR');
    const result = await Tesseract.recognize(filePath, 'eng');
    return result.data.text;
  } catch (error) {
    console.error('OCR error:', error);
    throw error;
  }
}

// PDF extraction with OCR fallback
async function extractPDF(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  
  if (data.text && data.text.trim().length > 100) {
    return data.text;
  }
  
  // If text extraction failed, it might be scanned - use OCR
  console.log('PDF appears scanned, using OCR...');
  return await extractImageOCR(filePath);
}

// DOCX extraction
async function extractDOCX(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Excel extraction (row-level indexing)
async function extractExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const results = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (jsonData.length === 0) continue;

    const headers = jsonData[0];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowObj = {};
      headers.forEach((header, idx) => {
        rowObj[header] = row[idx];
      });
      results.push({
        type: 'row',
        sheet: sheetName,
        rowNumber: i,
        data: rowObj,
        text: Object.values(rowObj).join(' | ')
      });
    }
  }

  return results;
}

// Main extraction dispatcher
async function extractText(filePath, mimeType) {
  try {
    if (mimeType.includes('pdf')) {
      return { text: await extractPDF(filePath), type: 'text' };
    } else if (mimeType.includes('wordprocessing') || mimeType.includes('msword')) {
      return { text: await extractDOCX(filePath), type: 'text' };
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
      return { rows: await extractExcel(filePath), type: 'rows' };
    } else if (mimeType.includes('image')) {
      return { text: await extractImageOCR(filePath), type: 'text' };
    } else if (mimeType.includes('text/plain')) {
      return { text: await fs.readFile(filePath, 'utf-8'), type: 'text' };
    }
    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

// Generate embeddings using Vertex AI or Gemini
async function getEmbedding(text) {
  if (vertexRAG) {
    return await vertexRAG.generateEmbedding(text);
  }
  return await embedQueue.addToQueue(text);
}

async function getEmbeddingsBatch(texts) {
  if (vertexRAG) {
    return await vertexRAG.generateEmbeddingsBatch(texts);
  }
  // Fallback to sequential for Gemini
  const embeddings = [];
  for (const text of texts) {
    embeddings.push(await getEmbedding(text));
  }
  return embeddings;
}

// Call Gemini for answer generation
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    }),
    timeout: 30000
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
}

// Endpoints

// Health check
app.get('/health', (req, res) => {
  const stats = vectorStore.getStats();
  res.json({
    ok: true,
    status: 'healthy',
    stats,
    vertexAI: USE_VERTEX_AI ? 'enabled' : 'disabled',
    timestamp: Date.now()
  });
});

// Stats
app.get('/stats', (req, res) => {
  const stats = vectorStore.getStats();
  res.json({ ok: true, data: stats });
});

// Job status
app.get('/jobs/:id', (req, res) => {
  const job = jobManager.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found' });
  }
  res.json({ ok: true, data: job });
});

// Ingest files
app.post('/ingest', upload.array('files'), async (req, res) => {
  const jobId = jobManager.createJob('ingest', 'multiple files');
  
  // Start async processing
  processIngestion(req.files, req.body, jobId);
  
  res.json({ ok: true, jobId, message: 'Ingestion started' });
});

async function processIngestion(files, metadata, jobId) {
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      jobManager.updateJob(jobId, {
        progress: Math.floor((i / files.length) * 100),
        message: `Processing ${file.originalname}...`
      });

      const docId = uuidv4();
      const mimeType = metadata.mimeTypes?.[i] || file.mimetype;
      
      vectorStore.addDocument(
        docId,
        file.originalname,
        mimeType,
        metadata.system || '',
        metadata.subsystem || '',
        file.path
      );

      // Use Vertex AI Document AI for enhanced OCR if available
      let extracted;
      if (vertexRAG && (mimeType.includes('pdf') || mimeType.includes('image'))) {
        try {
          const vertexResult = await vertexRAG.processDocument(file.path, mimeType);
          extracted = {
            text: vertexResult.text,
            tables: vertexResult.tables,
            entities: vertexResult.entities,
            type: 'text'
          };
        } catch (error) {
          console.warn('Vertex AI OCR failed, falling back to standard extraction:', error.message);
          extracted = await extractText(file.path, mimeType);
        }
      } else {
        extracted = await extractText(file.path, mimeType);
      }
      
      if (extracted.type === 'text') {
        const chunks = chunkText(extracted.text);
        
        // Batch embeddings for efficiency
        if (chunks.length > 5 && (vertexRAG || embedQueue)) {
          const embeddings = await getEmbeddingsBatch(chunks);
          for (let j = 0; j < chunks.length; j++) {
            vectorStore.addChunk(uuidv4(), docId, chunks[j], embeddings[j], j);
          }
        } else {
          for (let j = 0; j < chunks.length; j++) {
            const embedding = await getEmbedding(chunks[j]);
            vectorStore.addChunk(uuidv4(), docId, chunks[j], embedding, j);
          }
        }
      } else if (extracted.type === 'rows') {
        const texts = extracted.rows.map(r => r.text);
        const embeddings = await getEmbeddingsBatch(texts);
        
        for (let j = 0; j < extracted.rows.length; j++) {
          vectorStore.addChunk(uuidv4(), docId, texts[j], embeddings[j], j);
        }
      }

      await fs.unlink(file.path).catch(() => {});
    }

    jobManager.completeJob(jobId, { filesProcessed: files.length });
  } catch (error) {
    console.error('Ingestion error:', error);
    jobManager.failJob(jobId, error);
  }
}

// Ask AI with RAG
app.post('/ask', async (req, res) => {
  try {
    const { query, fileIds } = req.body;
    
    if (!query) {
      return res.status(400).json({ ok: false, error: 'Query is required' });
    }

    const queryEmbedding = await getEmbedding(query);
    const results = vectorStore.searchSimilar(queryEmbedding, 10);

    if (results.length === 0) {
      return res.json({
        ok: true,
        data: {
          answer: 'No relevant documents found. Please upload and index documents first.',
          sources: []
        }
      });
    }

    const context = results.map((r, i) => 
      `[${i + 1}] (Score: ${r.similarity.toFixed(3)}, File: ${r.fileName})\n${r.chunk}`
    ).join('\n\n');

    const prompt = `You are a helpful AI assistant. Answer the question using ONLY the provided context. Use HTML formatting for your response. Include inline citations like [1], [2] etc.

Context:
${context}

Question: ${query}

Instructions:
- Answer concisely and accurately
- Use HTML tags for formatting (<strong>, <ul>, <li>, <table>, etc.)
- Cite sources using [1], [2], etc.
- If the context contains tabular data, use HTML <table>
- If you cannot answer from the context, say so clearly

Answer:`;

    let answer;
    if (vertexRAG) {
      answer = await vertexRAG.generateResponse(query, context);
    } else {
      answer = await callGemini(prompt);
    }

    const sources = results.map((r, i) => ({
      id: i + 1,
      fileName: r.fileName,
      system: r.system,
      subsystem: r.subsystem,
      score: r.similarity.toFixed(3),
      preview: r.chunk.substring(0, 200) + '...'
    }));

    res.json({
      ok: true,
      data: {
        answer,
        sources,
        context: results.length
      }
    });

  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({
      ok: false,
      error: error.message,
      traceId: uuidv4()
    });
  }
});

// Multi-document search
app.post('/search-multi', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ ok: false, error: 'Query is required' });
    }

    const queryEmbedding = await getEmbedding(query);
    const results = vectorStore.searchSimilar(queryEmbedding, 20);

    res.json({
      ok: true,
      data: {
        results: results.map(r => ({
          fileName: r.fileName,
          chunk: r.chunk,
          score: r.similarity.toFixed(3),
          system: r.system,
          subsystem: r.subsystem
        }))
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Clear vector store
app.delete('/clear', (req, res) => {
  try {
    vectorStore.clear();
    res.json({ ok: true, message: 'Vector store cleared' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ KMRCL Backend v2.0 running on port ${PORT}`);
  console.log(`📊 Vector store ready`);
  console.log(`🔑 Gemini API configured`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  vectorStore.close();
  process.exit(0);
});
