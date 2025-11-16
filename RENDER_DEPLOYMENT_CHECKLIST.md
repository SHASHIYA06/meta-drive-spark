# ✅ RENDER DEPLOYMENT - WORKING VERSION

## 🚨 CRITICAL: Push Updated Code First!

Before deploying to Render, you MUST push the latest code to GitHub:

```bash
cd /path/to/meta-drive-spark
git add .
git commit -m "Fix Render deployment - simplified backend"
git push origin main
```

**Wait 30 seconds for GitHub to process**, then proceed to Render.

---

## Step 1: Create Render Web Service

1. Go to: https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `SHASHIYA06/meta-drive-spark`
4. Click **Connect**

---

## Step 2: Configure Service Settings (EXACT VALUES)

Copy these settings EXACTLY as shown:

| Setting | Value | ⚠️ Important |
|---------|-------|--------------|
| **Name** | `kmrcl-ai-backend` | Any name is fine |
| **Region** | `Oregon (US West)` | Choose closest to users |
| **Branch** | `main` | **MUST match your GitHub branch** |
| **Root Directory** | `backend` | **CRITICAL - Don't forget!** |
| **Runtime** | `Node` | Auto-detected |
| **Build Command** | `npm install` | Default is fine |
| **Start Command** | `node server.js` | Must be exact |
| **Plan** | `Free` | Or Starter for better performance |

---

## Step 3: Add Environment Variables

Click **Environment** tab in Render dashboard, then add these one by one:

### ✅ Required (Must Add):

**1. GEMINI_API_KEY**
```
Key: GEMINI_API_KEY
Value: AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk
```

**2. FRONTEND_URL**
```
Key: FRONTEND_URL  
Value: https://bemlkmrcldocuemt.netlify.app
```

**3. PORT**
```
Key: PORT
Value: 10000
```

### ⚠️ Optional (Only if you want Google Cloud Vertex AI):

**4. GOOGLE_CLOUD_PROJECT**
```
Key: GOOGLE_CLOUD_PROJECT
Value: your-google-cloud-project-id
```

**5. GOOGLE_APPLICATION_CREDENTIALS_JSON**
```
Key: GOOGLE_APPLICATION_CREDENTIALS_JSON
Value: {"type":"service_account","project_id":"your-project-id",...}
```
⚠️ **Important**: Paste entire JSON on ONE LINE with NO line breaks

**6. VERTEX_AI_LOCATION**
```
Key: VERTEX_AI_LOCATION
Value: us-central1
```

---

## Step 4: Deploy!

1. Click **Create Web Service** button at the bottom
2. Render will start building (5-10 minutes first time)
3. Watch the **Logs** tab for progress
4. Your service URL will be: `https://kmrcl-ai-backend.onrender.com`

---

## Step 5: Test Your Deployment

Once deployment shows "Live", test the health endpoint:

```bash
curl https://kmrcl-ai-backend.onrender.com/health
```

**Expected Response:**
```json
{
  "ok": true,
  "status": "healthy",
  "stats": { "documents": 0, "chunks": 0 },
  "vertexAI": "disabled"
}
```

If you get this response, deployment succeeded! ✅

---

## Step 6: Update Frontend

Update your frontend environment variables:

**In Netlify Dashboard:**
1. Go to Site settings → Build & deploy → Environment
2. Add/Update:
   ```
   VITE_BACKEND_URL=https://kmrcl-ai-backend.onrender.com
   ```
3. Trigger redeploy

---

## 🔧 Troubleshooting Common Errors

### Error: "Cannot find module './vectorStore'"
**Cause**: `Root Directory` not set to `backend`  
**Fix**: Go to Settings → change Root Directory to `backend` → Save → Redeploy

### Error: "ENOENT: no such file or directory"
**Cause**: Files missing or wrong start command  
**Fix**: Ensure `Start Command` is exactly `node server.js`

### Error: "Port already in use"
**Cause**: PORT env var not set  
**Fix**: Add environment variable `PORT=10000` in Render

### Build succeeds but service won't start
**Cause**: Missing environment variables  
**Fix**: 
1. Check Logs tab for specific error
2. Ensure `GEMINI_API_KEY` is set
3. Ensure `FRONTEND_URL` is set

### Error: "sharp" or "better-sqlite3" build failed
**Cause**: Native dependencies need rebuild on Render  
**Fix**: Change Build Command to:
```
npm install --build-from-source && npm rebuild sharp better-sqlite3 --build-from-source
```

---

## Deployment Status Checklist

- [ ] Pushed latest code to GitHub
- [ ] Set Root Directory to `backend`
- [ ] Added all 3 required environment variables
- [ ] Build completed successfully
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

---

## 🎯 Common Mistakes to Avoid

1. ❌ Forgetting to set **Root Directory** to `backend`
2. ❌ Not pushing code to GitHub before deploying
3. ❌ Missing required environment variables
4. ❌ Using wrong branch name
5. ❌ Not waiting for build to complete before testing

---

## What Changed?

✅ **Simplified backend** - Works with just Gemini API
✅ **Google Cloud is optional** - Only loads if configured
✅ **Fixed dependencies** - Removed problematic packages
✅ **Better error handling** - Clear logs and fallbacks
