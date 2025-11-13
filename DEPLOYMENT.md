# KMRCL Metro Document Intelligence - Deployment Guide

## 🚀 Complete Deployment Instructions

### Prerequisites
- Node.js 18+ installed
- Git installed
- Netlify account (free)
- Render account (free)
- Google Account with Drive access

---

## Part 1: Backend Deployment (Render)

### Step 1: Prepare Backend
1. Navigate to the `backend` folder
2. Create a `.env` file:
```bash
GEMINI_API_KEY=AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk
FRONTEND_URL=https://your-app-name.netlify.app
PORT=3000
```

### Step 2: Deploy to Render
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `kmrcl-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

5. Add Environment Variables:
   - `GEMINI_API_KEY`: `AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk`
   - `FRONTEND_URL`: (will update after frontend deployment)
   - `PORT`: `3000`

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. **Save your backend URL**: `https://your-service.onrender.com`

### Step 3: Test Backend
```bash
curl https://your-service.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "documents": 0,
  "chunks": 0,
  "timestamp": "2025-01-13T..."
}
```

---

## Part 2: Frontend Deployment (Netlify)

### Step 1: Configure Frontend
1. Update `.env` file in project root:
```bash
VITE_BACKEND_URL=https://your-service.onrender.com
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
VITE_GOOGLE_DRIVE_FOLDER_ID=1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG
```

### Step 2: Deploy to Netlify
1. Go to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment variables**: Add all VITE_* variables from `.env`

5. Click "Deploy site"
6. Wait for deployment (2-5 minutes)
7. **Save your frontend URL**: `https://your-app-name.netlify.app`

### Step 3: Update Backend CORS
1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable to your Netlify URL
3. Redeploy backend service

---

## Part 3: Google Apps Script Deployment

### Step 1: Create Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Name it "KMRCL Metro Intelligence"

### Step 2: Add Code
1. Copy contents from `google-apps-script/Code.gs`
2. Paste into the script editor
3. Update `SHEET_ID` constant with your Google Sheet ID
4. File → New → Script file → Name it `appsscript.json`
5. Copy contents from `google-apps-script/appsscript.json`

### Step 3: Create Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new sheet named "KMRCL Document Metadata"
3. Add headers in first row:
   - Date | File ID | File Name | MIME Type | Size | System | Subsystem | URL
4. Copy the Sheet ID from URL
5. Update `SHEET_ID` in Code.gs

### Step 4: Deploy as Web App
1. In Apps Script editor: Deploy → New deployment
2. Select type: "Web app"
3. Configuration:
   - **Description**: "KMRCL API v1"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click "Deploy"
5. Authorize the app (review permissions)
6. **Save the Web App URL**

### Step 5: Update Frontend
1. Copy the Web App URL
2. Update `.env` file:
```bash
VITE_APP_SCRIPT_URL=<your-web-app-url>
```
3. Redeploy frontend on Netlify

---

## Part 4: Testing the Complete System

### Test 1: Upload Files
1. Open your Netlify URL
2. Click "Upload Files"
3. Select a PDF or image
4. Verify:
   - ✅ File appears in Google Drive
   - ✅ Metadata in Google Sheet
   - ✅ Backend processes and indexes file

### Test 2: Folder Management
1. Click "Create Folder"
2. Enter name and create
3. Verify folder appears in tree

### Test 3: AI Search
1. Upload a document with content
2. Enter query: "What is this document about?"
3. Click "Document Details (AI)"
4. Verify AI response with citations

### Test 4: Architecture Search
1. Upload circuit diagram or technical doc
2. Query: "Find circuit diagrams for power supply"
3. Click "Architecture Search"
4. Verify structured results

---

## Part 5: Production Configuration

### Security Checklist
- [ ] Gemini API key stored securely in Render
- [ ] Apps Script deployed with proper permissions
- [ ] CORS configured correctly
- [ ] Google Sheet access restricted to service account
- [ ] Environment variables not committed to Git

### Performance Optimization
- [ ] Enable Netlify CDN
- [ ] Configure Render auto-scaling (paid plans)
- [ ] Add Redis cache for vector store (optional)
- [ ] Implement rate limiting

### Monitoring
- [ ] Set up Render monitoring
- [ ] Configure Netlify analytics
- [ ] Add error logging (Sentry, LogRocket)
- [ ] Create uptime monitoring (UptimeRobot)

---

## Troubleshooting

### Backend Issues
**Problem**: Backend not responding
- Check Render logs
- Verify GEMINI_API_KEY is set
- Test `/health` endpoint

**Problem**: CORS errors
- Update FRONTEND_URL in Render
- Redeploy backend

### Frontend Issues
**Problem**: Can't connect to backend
- Verify VITE_BACKEND_URL is correct
- Check browser console for errors
- Test backend URL directly

### Apps Script Issues
**Problem**: Permission denied
- Reauthorize the script
- Check OAuth scopes in appsscript.json
- Verify Sheet ID is correct

**Problem**: Web app not accessible
- Redeploy as new version
- Check "Who has access" setting
- Clear browser cache

---

## Local Development

### Backend
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:3000
```

### Frontend
```bash
npm install
npm run dev
# Runs on http://localhost:8080
```

### Environment Variables
Create `.env` files as shown in `.env.example`

---

## Support

For issues or questions:
- Email: info@kmrcl.com
- Phone: +91-123-456-7890

## Version
- Backend: v1.0.0
- Frontend: v1.0.0
- Apps Script: v1.0.0
- Last Updated: January 2025
