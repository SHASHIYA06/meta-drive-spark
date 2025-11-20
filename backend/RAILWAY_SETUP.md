# Railway Deployment Guide - KMRCL Metro Document Intelligence

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub repository connected to Railway
- Google Cloud Project with Vertex AI enabled (for advanced OCR)

## Step 1: Create New Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `SHASHIYA06/meta-drive-spark`
5. Railway will auto-detect the backend directory

## Step 2: Configure Service

1. Click on your service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `node server.js`
5. Set **Build Command**: `npm install`

## Step 3: Environment Variables

Go to **Variables** tab and add these:

### Required Variables
```
GEMINI_API_KEY=AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk
PORT=3000
NODE_ENV=production
```

### Optional - For Enhanced Processing (Vertex AI)
```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}
VERTEX_AI_LOCATION=us-central1
VERTEX_PROCESSOR_ID=your-processor-id
```

### Processing Configuration
```
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
BATCH_SIZE=8
OCR_LANG=eng
SQLITE_PATH=/app/data/vectorstore.sqlite
```

### Frontend URL (will be generated)
```
FRONTEND_URL=https://your-frontend-url.netlify.app
```

## Step 4: Add Persistent Storage (CRITICAL for SQLite)

1. Go to **Settings** > **Volumes**
2. Click **"Add Volume"**
3. Set **Mount Path**: `/app/data`
4. This ensures your vector database persists across deployments

## Step 5: Deploy

1. Click **"Deploy"** button
2. Railway will build and deploy automatically
3. Get your service URL from the **Settings** > **Networking** > **Public Networking**
4. Example: `https://your-service-production.up.railway.app`

## Step 6: Update Frontend

Update your frontend API endpoint to point to Railway:

```javascript
const API_URL = 'https://your-service-production.up.railway.app';
```

## Vertex AI Setup (for Advanced Document Processing)

### Why Vertex AI?
- Enhanced OCR for scanned PDFs and technical drawings
- Circuit diagram recognition
- Table extraction from complex documents
- High-accuracy text extraction from metro rail blueprints

### Setup Steps:

1. **Enable APIs in Google Cloud Console**:
   - Document AI API
   - Vertex AI API
   - Cloud Storage API

2. **Create Document AI Processor**:
   ```bash
   gcloud documentai processors create \
     --display-name="Metro-Docs-Processor" \
     --type=FORM_PARSER_PROCESSOR \
     --location=us
   ```

3. **Create Service Account**:
   ```bash
   gcloud iam service-accounts create vertex-rag-sa \
     --display-name="Vertex RAG Service Account"
   ```

4. **Grant Permissions**:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:vertex-rag-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:vertex-rag-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/documentai.apiUser"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:vertex-rag-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   ```

5. **Download Service Account Key**:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=vertex-rag-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

6. **Convert to Single Line JSON** (for Railway):
   ```bash
   cat key.json | jq -c . | pbcopy
   ```
   Then paste into `GOOGLE_APPLICATION_CREDENTIALS_JSON` variable

## Testing Deployment

```bash
# Health check
curl https://your-service-production.up.railway.app/health

# Upload test document
curl -X POST https://your-service-production.up.railway.app/ingest \
  -F "files=@test-drawing.pdf" \
  -F "system=Metro System A" \
  -F "subsystem=Track Layout"

# Query
curl -X POST https://your-service-production.up.railway.app/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the track gauge specification?"}'
```

## Monitoring

1. View logs in Railway dashboard: **Deployments** > **View Logs**
2. Monitor metrics: **Metrics** tab
3. Check health endpoint: `https://your-service-production.up.railway.app/health`

## Cost Optimization

- Railway charges based on usage
- Free tier: $5 credit/month
- Typical usage: ~$10-20/month for moderate traffic
- Vertex AI: Pay per document processed (~$0.015/page for Document AI)

## Troubleshooting

### Issue: Database resets after deployment
**Solution**: Ensure persistent volume is mounted at `/app/data`

### Issue: Out of memory errors
**Solution**: Increase memory in Railway settings (default 512MB, recommend 1GB+)

### Issue: Vertex AI authentication fails
**Solution**: Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is valid JSON and has correct permissions

### Issue: Slow OCR processing
**Solution**: Increase `BATCH_SIZE` and ensure Vertex AI is enabled for parallel processing

## Advanced Features for Metro Rail Documents

The backend now supports:
- ✅ Scanned PDF processing with multi-strategy OCR
- ✅ Technical drawing recognition (circuit diagrams, track layouts)
- ✅ Table extraction from specification documents
- ✅ High-confidence text extraction with fallback strategies
- ✅ Row-level indexing for Excel/CSV equipment lists
- ✅ Batch embedding generation for faster ingestion
- ✅ Vertex AI Document AI for enhanced accuracy on complex documents

## Security Notes

- Never commit API keys to Git
- Use Railway's environment variables for all secrets
- Rotate API keys regularly
- Enable authentication on your API if deploying to production

## Next Steps

1. Deploy backend to Railway
2. Update frontend with Railway URL
3. Test document upload with metro rail drawings
4. Monitor performance and costs
5. Set up alerts for errors
