require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Multer configuration
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// In-memory vector store
const vectorStore = [];
let documentId = 0;

// Configuration
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
const GEMINI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Utility: Chunk text with overlap
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

// Utility: Get embedding from Gemini
async function getEmbedding(text) {
  try {
    const response = await fetch(`${GEMINI_EMBED_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      })
    });

    const data = await response.json();
    return data.embedding?.values || [];
  } catch (error) {
    console.error('Embedding error:', error);
    return [];
  }
}

// Utility: Cosine similarity
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Extract text from PDF
async function extractPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    
    // If text is minimal, try OCR
    if (data.text.trim().length < 100) {
      console.log('PDF appears scanned, trying OCR...');
      return await extractImageOCR(filePath);
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

// Extract text from images using OCR
async function extractImageOCR(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(m)
    });
    return text;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

// Extract text from DOCX
async function extractDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

// Extract text from Excel/CSV
async function extractExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      text += `Sheet: ${sheetName}\n${csv}\n\n`;
    });
    
    return text;
  } catch (error) {
    console.error('Excel extraction error:', error);
    return '';
  }
}

// Main extraction function
async function extractText(filePath, mimeType) {
  if (mimeType.includes('pdf')) {
    return await extractPDF(filePath);
  } else if (mimeType.includes('image')) {
    return await extractImageOCR(filePath);
  } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
    return await extractDOCX(filePath);
  } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return await extractExcel(filePath);
  } else {
    // Try reading as plain text
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }
}

// POST /ingest - Upload and index files
app.post('/ingest', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of files) {
      try {
        // Extract text
        const text = await extractText(file.path, file.mimetype);
        
        if (!text || text.trim().length === 0) {
          results.push({
            fileName: file.originalname,
            status: 'failed',
            error: 'No text extracted'
          });
          continue;
        }

        // Chunk text
        const chunks = chunkText(text);
        
        // Store chunks with embeddings
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await getEmbedding(chunk);
          
          vectorStore.push({
            id: `doc_${documentId}_chunk_${i}`,
            fileName: file.originalname,
            mimeType: file.mimetype,
            chunk,
            embedding,
            position: i,
            sourceId: documentId
          });
        }

        results.push({
          fileName: file.originalname,
          status: 'success',
          chunks: chunks.length
        });

        documentId++;
        
        // Clean up uploaded file
        await fs.unlink(file.path);
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        results.push({
          fileName: file.originalname,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({ 
      message: 'Processing complete',
      results,
      totalDocuments: documentId,
      totalChunks: vectorStore.length
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /ask - RAG query
app.post('/ask', async (req, res) => {
  try {
    const { query, fileIds } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    // Get query embedding
    const queryEmbedding = await getEmbedding(query);
    
    // Filter by fileIds if provided
    let searchSpace = vectorStore;
    if (fileIds && fileIds.length > 0) {
      searchSpace = vectorStore.filter(item => 
        fileIds.includes(item.sourceId.toString())
      );
    }

    // Find top-K similar chunks
    const similarities = searchSpace.map(item => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, 10);

    // Build context
    const context = topResults.map(r => 
      `[Source: ${r.fileName}]\n${r.chunk}`
    ).join('\n\n---\n\n');

    // Generate response with Gemini
    const response = await fetch(`${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Context:\n${context}\n\nQuestion: ${query}\n\nProvide a detailed answer based on the context above. Use HTML formatting for better readability. Include <table> tags for tabular data. Cite sources where applicable.`
          }]
        }]
      })
    });

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated';

    // Format sources
    const sources = topResults.map(r => ({
      fileName: r.fileName,
      snippet: r.chunk.slice(0, 200) + '...',
      similarity: r.similarity.toFixed(3)
    }));

    res.json({
      answer,
      sources,
      contextsFound: topResults.length
    });
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /search-multi - Multi-document search
app.post('/search-multi', async (req, res) => {
  try {
    const { query, fileIds } = req.body;
    
    const queryEmbedding = await getEmbedding(query);
    
    let searchSpace = vectorStore;
    if (fileIds && fileIds.length > 0) {
      searchSpace = vectorStore.filter(item => 
        fileIds.includes(item.sourceId.toString())
      );
    }

    const results = searchSpace
      .map(item => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding)
      }))
      .filter(r => r.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20);

    res.json({
      results: results.map(r => ({
        fileName: r.fileName,
        text: r.chunk,
        similarity: r.similarity.toFixed(3)
      })),
      total: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /ingest-json - Structured data ingest
app.post('/ingest-json', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Search for structured data
    const queryEmbedding = await getEmbedding(query);
    
    const results = vectorStore
      .map(item => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding)
      }))
      .filter(r => r.similarity > 0.4)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15);

    const structuredData = results.map(r => ({
      source: r.fileName,
      content: r.chunk,
      relevance: r.similarity.toFixed(3)
    }));

    res.json({
      result: `<h3>Structured Search Results</h3><ul>${structuredData.map(d => 
        `<li><strong>${d.source}</strong> (${d.relevance}): ${d.content.slice(0, 150)}...</li>`
      ).join('')}</ul>`,
      data: structuredData
    });
  } catch (error) {
    console.error('Structured search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /clear - Clear vector store
app.delete('/clear', (req, res) => {
  vectorStore.length = 0;
  documentId = 0;
  res.json({ message: 'Vector store cleared' });
});

// GET /health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    documents: documentId,
    chunks: vectorStore.length,
    timestamp: new Date().toISOString()
  });
});

// GET /stats
app.get('/stats', (req, res) => {
  const fileStats = {};
  vectorStore.forEach(item => {
    if (!fileStats[item.fileName]) {
      fileStats[item.fileName] = 0;
    }
    fileStats[item.fileName]++;
  });

  res.json({
    totalDocuments: documentId,
    totalChunks: vectorStore.length,
    fileStats
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KMRCL Backend running on port ${PORT}`);
  console.log(`📊 Vector store initialized`);
  console.log(`🔑 Gemini API: ${GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
});
