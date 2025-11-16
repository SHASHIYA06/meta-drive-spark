# 🚀 DEPLOY TO RENDER NOW - 3 STEPS

## ⚠️ CRITICAL: Do These Steps IN ORDER

---

## STEP 1: Push Updated Code to GitHub

**Open terminal in your project folder and run:**

```bash
git add .
git commit -m "Fix Render deployment - simplified backend"
git push origin main
```

**Wait 30 seconds** for GitHub to sync, then proceed.

---

## STEP 2: Create Render Service

1. Go to **https://dashboard.render.com/**
2. Click **New +** → **Web Service**
3. Connect to repository: `SHASHIYA06/meta-drive-spark`
4. Fill in these settings:

### 📋 Configuration (Copy Exactly):

```
Name: kmrcl-ai-backend
Region: Oregon (US West)
Branch: main
Root Directory: backend          ⚠️ CRITICAL - Don't skip!
Runtime: Node
Build Command: npm install
Start Command: node server.js
Plan: Free
```

### 🔑 Environment Variables (Click "Add Environment Variable"):

**Add these 3 required variables:**

1. **GEMINI_API_KEY**
   ```
   AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk
   ```

2. **FRONTEND_URL**
   ```
   https://bemlkmrcldocuemt.netlify.app
   ```

3. **PORT**
   ```
   10000
   ```

4. Click **Create Web Service**

---

## STEP 3: Wait & Test

1. **Wait 5-10 minutes** while Render builds
2. Watch the **Logs** tab - should see: "✅ Server running on port 10000"
3. Copy your service URL: `https://kmrcl-ai-backend.onrender.com`
4. Test it:

```bash
curl https://kmrcl-ai-backend.onrender.com/health
```

Should return:
```json
{
  "ok": true,
  "status": "healthy",
  "stats": { "documents": 0, "chunks": 0 }
}
```

✅ **If you see this, deployment succeeded!**

---

## Next: Update Frontend

Go to Netlify dashboard:
1. Site settings → Environment variables
2. Update `VITE_BACKEND_URL` to your Render URL:
   ```
   https://kmrcl-ai-backend.onrender.com
   ```
3. Trigger redeploy

---

## ❌ If Build Fails

### Build error with native packages
→ In Render Settings, change **Build Command** to:
```
npm install --build-from-source && npm rebuild sharp better-sqlite3
```

### "Cannot find module './vectorStore'"
→ You forgot to set **Root Directory** to `backend` in Step 2.

### "GEMINI_API_KEY not found"
→ Add the environment variable in Render dashboard.

---

## 🎯 Most Common Mistakes

1. **Forgetting Root Directory** - Must be set to `backend`
2. **Wrong branch** - Must be `main` (check your GitHub repo)
3. **Missing environment variables** - Add all 3 required variables
4. **Not pushing code first** - Must push to GitHub before deploying

---

## ✨ Optional: Enable Advanced Features

If you want to use **Google Cloud Vertex AI** for enhanced OCR:

1. Add these additional environment variables in Render:
   - `GOOGLE_CLOUD_PROJECT` - Your GCP project ID
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Service account JSON (one line)
   - `VERTEX_AI_LOCATION` - `us-central1`

2. The backend will automatically detect and use Vertex AI when configured.

---

**Need help?** Check the detailed troubleshooting in `RENDER_DEPLOYMENT_CHECKLIST.md`
