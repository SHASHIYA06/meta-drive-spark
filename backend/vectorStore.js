const Database = require('better-sqlite3');
const path = require('path');

class VectorStore {
  constructor(dbPath = './vectorstore.sqlite') {
    this.db = new Database(dbPath);
    this.initDatabase();
    this.memoryCache = new Map();
  }

  initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        mime_type TEXT,
        system TEXT,
        subsystem TEXT,
        source_path TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding BLOB NOT NULL,
        position INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_document_id ON chunks(document_id);
      CREATE INDEX IF NOT EXISTS idx_position ON chunks(position);
    `);
  }

  addDocument(id, fileName, mimeType, system, subsystem, sourcePath) {
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, file_name, mime_type, system, subsystem, source_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, fileName, mimeType, system, subsystem, sourcePath);
  }

  addChunk(id, documentId, chunkText, embedding, position) {
    const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
    const stmt = this.db.prepare(`
      INSERT INTO chunks (id, document_id, chunk_text, embedding, position)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, documentId, chunkText, embeddingBuffer, position);
    
    // Update memory cache
    this.memoryCache.set(id, { documentId, chunkText, embedding, position });
  }

  getAllChunks() {
    const stmt = this.db.prepare(`
      SELECT c.id, c.document_id, c.chunk_text, c.embedding, c.position,
             d.file_name, d.mime_type, d.system, d.subsystem, d.source_path
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
    `);
    
    const rows = stmt.all();
    return rows.map(row => ({
      id: row.id,
      documentId: row.document_id,
      chunk: row.chunk_text,
      embedding: Array.from(new Float32Array(row.embedding.buffer)),
      position: row.position,
      fileName: row.file_name,
      mimeType: row.mime_type,
      system: row.system,
      subsystem: row.subsystem,
      sourcePath: row.source_path
    }));
  }

  searchSimilar(queryEmbedding, topK = 10) {
    const chunks = this.getAllChunks();
    
    const results = chunks.map(chunk => ({
      ...chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  cosineSimilarity(a, b) {
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

  getStats() {
    const docCount = this.db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const chunkCount = this.db.prepare('SELECT COUNT(*) as count FROM chunks').get();
    
    return {
      documents: docCount.count,
      chunks: chunkCount.count
    };
  }

  clear() {
    this.db.exec('DELETE FROM chunks; DELETE FROM documents;');
    this.memoryCache.clear();
  }

  close() {
    this.db.close();
  }
}

module.exports = VectorStore;
