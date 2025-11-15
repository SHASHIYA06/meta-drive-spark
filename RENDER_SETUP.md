# 🚀 Render Deployment Setup Guide

## Complete Step-by-Step Instructions for KMRCL Document Intelligence

---

## Quick Start - Render Deployment (5 Minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

### Step 2: Create Render Web Service
1. Go to https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure settings:

**Basic Settings:**
- **Name**: `kmrcl-ai-backend`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ **IMPORTANT**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Instance Type:**
- Select **Free** (for testing)

### Step 3: Add Environment Variables

Click **Environment** tab and add:

```bash
# Required - Your Google Cloud Project ID
GOOGLE_CLOUD_PROJECT=your-project-id

# Required - Service Account JSON (one line, no line breaks)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}

# Required - Frontend URL (update after Netlify deployment)
FRONTEND_URL=https://your-app.netlify.app

# Optional - Vertex AI Configuration
VERTEX_AI_LOCATION=us-central1

# Optional - Server Configuration
PORT=10000
NODE_ENV=production
OCR_LANG=eng
BATCH_SIZE=8
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
SQLITE_PATH=/opt/render/project/src/vectorstore.sqlite
```

### Step 4: Deploy
1. Click **Create Web Service**
2. Wait 5-10 minutes for deployment
3. Your backend URL: `https://kmrcl-ai-backend.onrender.com`

### Step 5: Test Your Backend
```bash
curl https://kmrcl-ai-backend.onrender.com/health
```

Expected response:
```json
{
  "ok": true,
  "status": "healthy",
  "stats": {"documents": 0, "chunks": 0},
  "vertexAI": "enabled"
}
```

---

## Prerequisites (for Google Cloud integration)

1. **Google Cloud Account** with billing enabled
2. **Render Account** (free tier works)
3. **Service Account Key** from Google Cloud (optional for advanced features)

---

## Part 1: Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `kmrcl-document-ai`
3. Enable billing for the project
4. Note your **Project ID**

### Step 2: Enable Required APIs

Enable these APIs in your project:

```bash
# Using gcloud CLI (recommended)
gcloud services enable aiplatform.googleapis.com
gcloud services enable documentai.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable storage-component.googleapis.com

# Or enable via Console:
# 1. Go to APIs & Services > Library
# 2. Search and enable:
#    - Vertex AI API
#    - Document AI API
#    - Cloud Storage API
```

### Step 3: Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `kmrcl-backend-sa`
4. Grant roles:
   - Vertex AI User
   - Document AI API User
   - Storage Admin
   - Storage Object Admin
5. Click **Create Key** > **JSON**
6. **Download the JSON key file** (keep it secure!)

### Step 4: Create Document AI Processor

1. Go to **Document AI** > **Processors**
2. Click **Create Processor**
3. Select **OCR Processor** (or **Form Parser** for better table extraction)
4. Name: `kmrcl-ocr-processor`
5. Select region: `us` or `eu`
6. **Copy the Processor ID** (format: `1234567890abcdef`)

---

## Part 2: Prepare Service Account JSON for Render

### Convert JSON to Single-Line String

```bash
# Method 1: Using jq
cat service-account-key.json | jq -c . > credentials-oneline.json

# Method 2: Using Python
python3 -c "import json; print(json.dumps(json.load(open('service-account-key.json'))))" > credentials-oneline.json

# Method 3: Manual (copy the entire file content as one line)
```

The result should look like:
```
{"type":"service_account","project_id":"kmrcl-document-ai","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
```

---

## Part 3: Deploy to Render

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit - KMRCL Document AI"
git branch -M main
git remote add origin https://github.com/yourusername/kmrcl-ai.git
git push -u origin main
```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** > **Web Service**
3. Connect your **GitHub repository**
4. Configure:

**Service Details:**
- **Name**: `kmrcl-ai-backend`
- **Region**: `Oregon (US West)` (recommended for Vertex AI us-central1)
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy:**
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm install --build-from-source && npm rebuild sharp --build-from-source && npm rebuild better-sqlite3 --build-from-source
  ```
- **Start Command**: `node server.js`

**Instance Type:**
- **Free** (for testing)
- **Starter** or higher (for production - recommended for better-sqlite3 and sharp)

### Step 3: Add Environment Variables

Click **Environment** and add these variables:

```bash
# Google Cloud Configuration (CRITICAL)
GOOGLE_CLOUD_PROJECT=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...} # Paste the one-line JSON here
VERTEX_AI_LOCATION=us-central1
VERTEX_PROCESSOR_ID=1234567890abcdef # Your processor ID

# Server Configuration
FRONTEND_URL=https://your-app.netlify.app  # Update after frontend deployment
PORT=10000
NODE_ENV=production

# Processing Configuration
OCR_LANG=eng
BATCH_SIZE=8
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
SQLITE_PATH=/opt/render/project/src/vectorstore.sqlite
```

**Important Notes:**
- For `GOOGLE_APPLICATION_CREDENTIALS_JSON`, paste the ENTIRE one-line JSON from Step 2
- Do NOT add quotes around the JSON value in Render's environment variable field
- Make sure there are no line breaks in the JSON

### Step 4: Deploy

1. Click **Create Web Service**
2. Wait 10-15 minutes for first deployment
3. Monitor build logs for errors
4. Once deployed, note your service URL: `https://kmrcl-ai-backend.onrender.com`

---

## Part 4: Verify Deployment

### Test Health Endpoint

```bash
curl https://kmrcl-ai-backend.onrender.com/health
```

Expected response:
```json
{
  "ok": true,
  "status": "healthy",
  "stats": {
    "documents": 0,
    "chunks": 0
  },
  "vertexAI": "enabled",
  "timestamp": 1737836400000
}
```

### Test OCR Endpoint

```bash
curl -X POST https://kmrcl-ai-backend.onrender.com/test-ocr \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Part 5: Common Issues & Solutions

### Issue 1: Build Fails - Native Dependencies

**Error**: `Error: Could not load the "sharp" module`

**Solution**:
- Upgrade Render plan to **Starter** or higher
- Ensure build command includes `--build-from-source` flags
- Check Node version matches (18+)

### Issue 2: Google Cloud Authentication Fails

**Error**: `Could not load the default credentials`

**Solution**:
- Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is properly formatted (no line breaks)
- Check service account has required roles
- Ensure APIs are enabled in Google Cloud Console

### Issue 3: Vertex AI Quota Exceeded

**Error**: `Resource exhausted: Quota exceeded`

**Solution**:
- Go to Google Cloud Console > IAM & Admin > Quotas
- Request quota increase for:
  - Vertex AI Prediction requests
  - Document AI Processing requests
- Or implement rate limiting in your app

### Issue 4: SQLite Database Not Persisting

**Solution**:
- Use Render's **Persistent Disk** feature (paid plans)
- Or migrate to **PostgreSQL** with pgvector extension
- Update `SQLITE_PATH` to use persistent storage path

### Issue 5: Cold Starts / Slow Response

**Solution**:
- Upgrade to paid Render plan (keeps service warm)
- Implement health check pings every 5 minutes
- Use Render Cron Jobs to keep service active

---

## Part 6: Scaling for Production

### Enable Persistent Storage

1. In Render Dashboard, go to your service
2. Click **Disk** tab
3. Add Persistent Disk:
   - **Name**: `vectorstore-disk`
   - **Mount Path**: `/data`
   - **Size**: 1 GB (minimum)
4. Update environment variable:
   ```bash
   SQLITE_PATH=/data/vectorstore.sqlite
   ```

### Add Health Check Monitoring

Create a separate Render Cron Job to ping your service:

```yaml
# render-cron.yaml
services:
  - type: cron
    name: kmrcl-health-ping
    env: node
    schedule: "*/5 * * * *"  # Every 5 minutes
    buildCommand: "echo 'No build needed'"
    startCommand: "curl https://kmrcl-ai-backend.onrender.com/health"
```

### Set Up Logging

Add to your `server.js`:

```javascript
// Log to external service
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const loggingWinston = new LoggingWinston({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    loggingWinston,
  ],
});
```

---

## Part 7: Cost Optimization

### Google Cloud Costs

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| Vertex AI Predictions | First 1,000 requests/month | ~$0.0001/request |
| Document AI OCR | First 1,000 pages/month | $0.015/page |
| Cloud Storage | 5 GB/month | $0.020/GB |

**Tips:**
- Use Cloud Storage lifecycle policies to auto-delete old files
- Cache embeddings in SQLite to avoid re-processing
- Batch requests when possible

### Render Costs

- **Free Plan**: Works but with cold starts and limited resources
- **Starter Plan** ($7/month): Recommended for production
- **Standard Plan** ($25/month): Best performance

---

## Part 8: Frontend Integration

Update your frontend `.env`:

```bash
VITE_BACKEND_URL=https://kmrcl-ai-backend.onrender.com
```

Redeploy frontend to Netlify/Vercel.

---

## Support & Resources

- **Vertex AI Docs**: https://cloud.google.com/vertex-ai/docs
- **Document AI Docs**: https://cloud.google.com/document-ai/docs
- **Render Docs**: https://render.com/docs
- **Troubleshooting**: Check Render logs via Dashboard > Logs

---

## Quick Start Checklist

- [ ] Google Cloud project created
- [ ] APIs enabled (Vertex AI, Document AI, Storage)
- [ ] Service account created with proper roles
- [ ] Service account JSON key downloaded
- [ ] Document AI processor created
- [ ] JSON converted to one-line format
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables added to Render
- [ ] Service deployed successfully
- [ ] Health endpoint responding
- [ ] Frontend updated with backend URL

---

**Ready to deploy!** If you encounter issues, check the logs in Render Dashboard or refer to the troubleshooting section above.
