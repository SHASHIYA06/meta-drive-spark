# 🚀 DEPLOY TO RENDER NOW - 3 STEPS

## ⚠️ CRITICAL: Do These Steps IN ORDER

---

## STEP 1: Push Updated Code to GitHub

**Open terminal in your project folder and run:**

```bash
git add .
git commit -m "Fix Render deployment"
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
Build Command: npm install
Start Command: node server.js
Plan: Free
```

### 🔑 Environment Variables (Click "Add Environment Variable"):

**Add these 3 required variables:**

1. Variable name: `GEMINI_API_KEY`  
   Value: `AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk`

2. Variable name: `FRONTEND_URL`  
   Value: `https://bemlkmrcldocuemt.netlify.app`

3. Variable name: `PORT`  
   Value: `10000`

5. Click **Create Web Service**

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
2. Update `VITE_BACKEND_URL` to your Render URL
3. Trigger redeploy

---

## ❌ If Build Fails

### "opencv4nodejs not found"
→ You didn't push the latest code. Go back to Step 1.

### "Cannot find module './vectorStore'"
→ You forgot to set Root Directory to `backend` in Step 2.

### Still having issues?
→ Check detailed troubleshooting in `RENDER_DEPLOYMENT_CHECKLIST.md`

---

**🎯 Most common mistake:** Forgetting to set **Root Directory** to `backend`
