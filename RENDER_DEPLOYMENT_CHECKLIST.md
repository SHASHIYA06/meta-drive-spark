# ✅ Render Deployment Checklist

## Before Deployment

- [ ] Push code to GitHub (main branch)
- [ ] Confirm `backend/` folder exists in repository
- [ ] Environment variables ready (see below)

---

## Render Dashboard Settings (COPY THESE EXACTLY)

### 1. Create New Web Service
Go to: https://dashboard.render.com/ → **New +** → **Web Service**

### 2. Connect Repository
- Select your GitHub repo: `meta-drive-spark`
- Click **Connect**

### 3. Configure Service (EXACT SETTINGS)

| Setting | Value |
|---------|-------|
| **Name** | `kmrcl-ai-backend` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ **CRITICAL** |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### 4. Environment Variables (Add in Render Dashboard)

Click **Environment** tab, then add each variable:

#### Required Variables:
```
GOOGLE_CLOUD_PROJECT
Value: your-google-cloud-project-id
```

```
GOOGLE_APPLICATION_CREDENTIALS_JSON
Value: {"type":"service_account","project_id":"your-project",...}
(Paste entire JSON on ONE LINE, no line breaks)
```

```
FRONTEND_URL
Value: https://bemlkmrcldocuemt.netlify.app
```

#### Optional Variables (with defaults):
```
VERTEX_AI_LOCATION=us-central1
PORT=10000
NODE_ENV=production
OCR_LANG=eng
BATCH_SIZE=8
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
SQLITE_PATH=/opt/render/project/src/vectorstore.sqlite
```

---

## Deploy & Test

### 5. Deploy
- Click **Create Web Service**
- Wait 5-10 minutes for build
- **Build logs** will show progress
- Note your service URL: `https://kmrcl-ai-backend.onrender.com`

### 6. Test Backend
```bash
# Health check
curl https://kmrcl-ai-backend.onrender.com/health

# Expected response:
{
  "ok": true,
  "status": "healthy",
  "stats": { "documents": 0, "chunks": 0 },
  "vertexAI": "enabled"
}
```

### 7. Update Frontend
Update frontend `.env.production`:
```
VITE_BACKEND_URL=https://kmrcl-ai-backend.onrender.com
```

Redeploy frontend to Netlify.

---

## Common Issues

### ❌ "No matching version found for opencv4nodejs"
**Fixed** - Removed from dependencies

### ❌ "Cannot find module 'pdf2pic'"
**Fixed** - Using pdf-parse only for now

### ❌ "Build failed - wrong directory"
**Solution**: Set `Root Directory` to `backend` in Render settings

### ❌ "Module not found" errors
**Solution**: Ensure `Build Command` is exactly `npm install`

### ❌ Google Cloud auth failed
**Solution**: Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is single-line JSON with no line breaks

---

## Deployment Status

- [ ] Backend deployed successfully
- [ ] Health endpoint responding
- [ ] Frontend updated with backend URL
- [ ] Test file upload working
- [ ] Test AI query working

---

## Quick Reference

**Backend URL**: https://kmrcl-ai-backend.onrender.com
**Frontend URL**: https://bemlkmrcldocuemt.netlify.app
**Apps Script**: https://script.google.com/macros/s/AKfycby6XbPuA7XDjIbInBg8-CmBv1Ig7hy5-BuKq6q4ovSJfbDxz3JdkyK08Y9pUI4S2CiZ7A/exec

**Support**: Check Render logs in Dashboard → Logs tab
