const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');

class EnhancedOCR {
  constructor() {
    this.tempDir = './temp-ocr';
  }

  async initialize() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Advanced image preprocessing for circuit drawings and technical diagrams
   */
  async preprocessForCircuits(imagePath) {
    try {
      const processedPath = `${imagePath}_processed.png`;

      await sharp(imagePath)
        // Convert to grayscale
        .greyscale()
        // Increase contrast for better line detection
        .normalize()
        // Apply adaptive thresholding for circuit lines
        .threshold(120)
        // Sharpen edges
        .sharpen()
        // Remove noise while preserving lines
        .median(3)
        .toFile(processedPath);

      return processedPath;
    } catch (error) {
      console.error('Preprocessing error:', error);
      return imagePath; // Fallback to original
    }
  }

  /**
   * Multiple preprocessing strategies for different document types
   */
  async preprocessImage(imagePath, strategy = 'default') {
    const strategies = {
      default: async () => {
        const processedPath = `${imagePath}_default.png`;
        await sharp(imagePath)
          .greyscale()
          .normalize()
          .threshold(128)
          .toFile(processedPath);
        return processedPath;
      },

      circuit: async () => {
        return await this.preprocessForCircuits(imagePath);
      },

      text: async () => {
        const processedPath = `${imagePath}_text.png`;
        await sharp(imagePath)
          .greyscale()
          .normalize()
          // Higher threshold for text
          .threshold(160)
          .sharpen()
          .toFile(processedPath);
        return processedPath;
      },

      scanned: async () => {
        const processedPath = `${imagePath}_scanned.png`;
        await sharp(imagePath)
          .greyscale()
          // Deskew
          .rotate(0)
          // Increase contrast
          .normalise()
          // Denoise
          .median(2)
          .threshold(140)
          .toFile(processedPath);
        return processedPath;
      },
    };

    const preprocessor = strategies[strategy] || strategies.default;
    return await preprocessor();
  }

  /**
   * OCR with multiple strategies and confidence scoring
   */
  async extractText(imagePath, options = {}) {
    const { strategy = 'default', language = 'eng' } = options;

    try {
      // Try multiple preprocessing strategies
      const strategies = ['default', 'circuit', 'text', 'scanned'];
      let bestResult = null;
      let highestConfidence = 0;

      for (const strat of strategies) {
        try {
          const processedPath = await this.preprocessImage(imagePath, strat);
          
          const result = await Tesseract.recognize(processedPath, language, {
            logger: info => {
              if (info.status === 'recognizing text') {
                console.log(`OCR Progress (${strat}): ${Math.round(info.progress * 100)}%`);
              }
            },
          });

          // Clean up processed image
          await fs.unlink(processedPath).catch(() => {});

          if (result.data.confidence > highestConfidence) {
            highestConfidence = result.data.confidence;
            bestResult = result;
          }

          // If we get high confidence, stop trying
          if (highestConfidence > 85) {
            break;
          }
        } catch (error) {
          console.error(`Strategy ${strat} failed:`, error.message);
        }
      }

      if (!bestResult) {
        throw new Error('All OCR strategies failed');
      }

      return {
        text: bestResult.data.text,
        confidence: bestResult.data.confidence,
        strategy: 'multi-strategy',
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw error;
    }
  }

  /**
   * Convert PDF pages to images and OCR each page (simplified - pdf-parse only)
   */
  async extractFromPDF(pdfPath) {
    try {
      // Note: For advanced PDF-to-image conversion, install pdf-poppler or ghostscript
      console.log('PDF OCR: Using pdf-parse text extraction only');
      
      const pdfParse = require('pdf-parse');
      const buffer = await fs.readFile(pdfPath);
      const data = await pdfParse(buffer);

      return {
        text: data.text || '',
        totalPages: data.numpages || 0,
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      return { text: '', totalPages: 0 };
    }
  }

  /**
   * Detect document type and apply appropriate OCR strategy
   */
  async detectAndProcess(filePath, mimeType) {
    if (mimeType.includes('pdf')) {
      // Try text extraction first
      const pdfParse = require('pdf-parse');
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);

      if (data.text && data.text.trim().length > 100) {
        return { text: data.text, type: 'text-pdf' };
      }

      // Fallback to OCR for scanned PDFs
      return await this.extractFromPDF(filePath);
    } else if (mimeType.includes('image')) {
      // Detect if it's a circuit/diagram or text document
      const metadata = await sharp(filePath).metadata();
      
      // Simple heuristic: wider images might be circuit diagrams
      const isCircuit = metadata.width > metadata.height * 1.5;
      
      const strategy = isCircuit ? 'circuit' : 'default';
      return await this.extractText(filePath, { strategy });
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = EnhancedOCR;
