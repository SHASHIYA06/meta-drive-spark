# 🚇 KMRCL Metro Document Intelligence

**AI-Powered Document Search Platform with RAG, OCR, and Vector Search**

Built for KMRCL Metro Rail Corporation Ltd. - A comprehensive document intelligence system that combines Google Drive integration, advanced OCR, and AI-powered search capabilities.

---

## 🌟 Features

### Document Processing
- **Multi-format support**: PDF, Word, Excel, Images, CSV
- **Advanced OCR**: Tesseract.js for scanned documents
- **Intelligent chunking**: 1200-char chunks with 200-char overlap
- **Vector embeddings**: Gemini text-embedding-004

### AI Search Capabilities
- **Document Details Search**: Natural language queries across all documents
- **Architecture Search**: Specialized for circuit diagrams and technical drawings
- **Structured Search**: JSON-formatted results for tabular data
- **Semantic search**: Cosine similarity with top-K retrieval

### Google Drive Integration
- **Folder tree navigation**: Visual folder structure
- **Multi-file upload**: Batch processing with drag-and-drop
- **Metadata tracking**: Google Sheets integration
- **Access control**: Apps Script security

### Beautiful UI
- **Glass morphism design**: Modern, professional interface
- **Gradient animations**: Dynamic background effects
- **Responsive layout**: Works on all devices
- **Real-time feedback**: Status indicators and loading states

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React Frontend│
│   (Netlify)     │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
┌────────▼────────┐   ┌▼───────────────┐
│  Node.js Backend│   │ Google Apps    │
│  RAG + Vector DB│   │ Script (GAS)   │
│  (Render)       │   │                │
└────────┬────────┘   └┬───────────────┘
         │             │
         │             │
    ┌────▼─────────────▼───┐
    │  Google Drive + Sheet│
    │  Document Storage    │
    └─────────────────────┘
         │
         │
    ┌────▼─────────────┐
    │  Gemini AI API   │
    │  Embeddings +    │
    │  Generation      │
    └──────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Account
- Gemini API Key: `AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk`

### Local Development

#### 1. Clone Repository
```bash
git clone <your-repo-url>
cd kmrcl-metro-intelligence
```

#### 2. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

#### 3. Configure Environment
Create `.env` in project root:
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
VITE_GOOGLE_DRIVE_FOLDER_ID=1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG
```

Create `backend/.env`:
```env
GEMINI_API_KEY=AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk
FRONTEND_URL=http://localhost:8080
PORT=3000
```

#### 4. Start Backend
```bash
cd backend
node server.js
```

#### 5. Start Frontend
```bash
npm run dev
```

Visit: `http://localhost:8080`

---

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions covering:
- Render (Backend)
- Netlify (Frontend)
- Google Apps Script (Drive Integration)

---

## 🎨 Design System

### Color Palette
- **Primary**: `hsl(200 100% 50%)` - Cyan Blue
- **Secondary**: `hsl(280 100% 65%)` - Purple
- **Background**: `hsl(222 47% 11%)` - Dark Navy
- **Foreground**: `hsl(210 40% 98%)` - Off White

### Components
- Glass morphism panels with blur effect
- Gradient animations
- Smooth transitions
- Semantic color tokens

---

## 🔌 API Endpoints

### Backend (Port 3000)

#### POST /ingest
Upload and index files
```bash
curl -X POST http://localhost:3000/ingest \
  -F "files=@document.pdf"
```

#### POST /ask
RAG query with context
```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?"}'
```

#### POST /search-multi
Multi-document search
```bash
curl -X POST http://localhost:3000/search-multi \
  -H "Content-Type: application/json" \
  -d '{"query": "circuit diagrams"}'
```

#### GET /health
Health check
```bash
curl http://localhost:3000/health
```

#### GET /stats
Vector store statistics
```bash
curl http://localhost:3000/stats
```

### Apps Script

#### GET ?action=listTree
Get folder tree

#### GET ?action=listFiles&folderId=xxx
List files in folder

#### POST action=createFolder
Create new folder

---

## 🧪 Testing

### Test Document Upload
1. Open application
2. Click "Upload Files"
3. Select PDF or image
4. Verify indexing completes

### Test AI Search
1. Upload sample document
2. Enter query: "summarize this document"
3. Click "Document Details (AI)"
4. Verify AI response with citations

### Test Architecture Search
1. Upload technical drawing
2. Query: "find circuit diagrams"
3. Click "Architecture Search"
4. Verify specialized results

---

## 📊 Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State**: React Hooks
- **Routing**: React Router v6
- **HTTP**: Fetch API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express
- **File Upload**: Multer
- **PDF**: pdf-parse
- **OCR**: Tesseract.js
- **Office**: mammoth, xlsx
- **AI**: Google Gemini API

### Infrastructure
- **Frontend Hosting**: Netlify
- **Backend Hosting**: Render
- **Storage**: Google Drive
- **Metadata**: Google Sheets
- **Serverless**: Google Apps Script

---

## 🔒 Security

- API keys stored in environment variables
- CORS configured for specific origins
- Apps Script OAuth 2.0 authentication
- Google Sheet access control
- No sensitive data in client code

---

## 📈 Performance

- **Chunk size**: 1200 characters
- **Overlap**: 200 characters
- **Top-K retrieval**: 10 results
- **Embedding model**: text-embedding-004
- **Generation model**: gemini-2.0-flash-exp

---

## 🐛 Troubleshooting

### Backend won't start
- Check Node version (18+)
- Verify `.env` file exists
- Ensure port 3000 is free

### Frontend can't connect
- Verify backend URL in `.env`
- Check CORS settings
- Test backend `/health` endpoint

### OCR not working
- Large images may take time
- Check Tesseract.js installation
- Try smaller file sizes first

### Apps Script errors
- Reauthorize permissions
- Check Sheet ID is correct
- Verify OAuth scopes

---

## 📝 License

Copyright © 2025 KMRCL Metro Rail Corporation Ltd.
All rights reserved.

---

## 🤝 Contributing

This is a proprietary project for KMRCL Metro. For internal contributions:
1. Create feature branch
2. Test thoroughly
3. Submit PR with description
4. Await review from tech lead

---

## 📞 Support

**Technical Support**
- Email: info@kmrcl.com
- Phone: +91-123-456-7890

**Built with ❤️ for KMRCL Metro**
