const fetch = require('node-fetch');

class EmbedQueue {
  constructor(apiKey, batchSize = 8) {
    this.apiKey = apiKey;
    this.batchSize = batchSize;
    this.queue = [];
    this.processing = false;
  }

  async addToQueue(text) {
    return new Promise((resolve, reject) => {
      this.queue.push({ text, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      try {
        const embeddings = await this.fetchEmbeddingsBatch(batch.map(item => item.text));
        
        batch.forEach((item, index) => {
          item.resolve(embeddings[index]);
        });
      } catch (error) {
        batch.forEach(item => item.reject(error));
      }

      // Rate limiting delay
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.processing = false;
  }

  async fetchEmbeddingsBatch(texts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${this.apiKey}`;
    
    const requests = texts.map(text => ({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] }
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
      timeout: 30000
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding batch failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.embeddings.map(e => e.values);
  }
}

module.exports = EmbedQueue;
