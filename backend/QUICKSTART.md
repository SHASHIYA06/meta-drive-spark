# 🚀 Quick Start Guide - Local Development

## Setup in 5 Minutes

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `backend/.env` file:

```bash
# Option A: Use Vertex AI (Recommended for Production)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
VERTEX_AI_LOCATION=us-central1
VERTEX_PROCESSOR_ID=your-processor-id

# Option B: Use Gemini API (Quick Start)
GEMINI_API_KEY=AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk

# Common Settings
FRONTEND_URL=http://localhost:8080
PORT=3000
NODE_ENV=development
```

### 3. Start Backend

```bash
npm start
```

Expected output:
```
✅ KMRCL Backend v2.0 running on port 3000
📊 Vector store ready
🔧 Configuration:
  - Vertex AI: ENABLED (or DISABLED)
  - Port: 3000
  - Chunk Size: 1200
  - Batch Size: 8
```

### 4. Test Backend

```bash
# Health check
curl http://localhost:3000/health

# Upload test file
curl -X POST http://localhost:3000/ingest \
  -F "files=@test.pdf" \
  -F "mimeTypes=application/pdf"

# Ask question
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the voltage rating?"}'
```

---

## Frontend Setup

### 1. Configure Frontend

Create `.env` in project root:

```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_APP_SCRIPT_URL=your-google-apps-script-url
```

### 2. Start Frontend

```bash
npm install
npm run dev
```

Frontend will be available at: `http://localhost:8080`

---

## Test End-to-End Flow

1. Open `http://localhost:8080`
2. Upload a PDF file (e.g., technical manual)
3. Wait for indexing to complete
4. Ask a question: "Find voltage specifications"
5. View AI-generated answer with citations

---

## Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (must be 18+)
- Verify `.env` file exists in `backend/` folder
- Check port 3000 is not in use

### OCR not working
- Install Tesseract: `brew install tesseract` (Mac) or `apt-get install tesseract-ocr` (Linux)
- Verify sharp is installed correctly: `npm rebuild sharp --build-from-source`

### Vertex AI errors
- Verify service account JSON is valid
- Check APIs are enabled in Google Cloud Console
- Ensure service account has proper roles

---

## Next Steps

- **Production Deploy**: See `RENDER_SETUP.md`
- **Google Drive Integration**: Configure Apps Script (see `DEPLOYMENT.md`)
- **Customize**: Edit `server.js` for your specific needs

---

**Need help?** Check logs in terminal or open an issue on GitHub.
