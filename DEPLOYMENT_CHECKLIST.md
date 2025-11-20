# 🚀 Complete Deployment Checklist

## Quick Setup Overview

Your app has 2 parts:
1. **Frontend** (Vercel) - The user interface
2. **Backend** (Render) - The AI and document processing engine

---

## Part 1: Deploy Backend to Render

### Step 1: Create Render Service

1. Go to https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `meta-drive-backend` (or any name)
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

### Step 2: Configure Environment Variables

In the Render dashboard, go to **Environment** tab and add:

```bash
# REQUIRED - AI Configuration
GEMINI_API_KEY=AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk

# REQUIRED - Server Configuration
NODE_ENV=production
PORT=10000

# REQUIRED - CORS (Replace with YOUR actual Vercel URL)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app

# Processing Configuration (Optional - defaults shown)
OCR_LANG=eng
BATCH_SIZE=8
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
SQLITE_PATH=/opt/render/project/src/vectorstore.sqlite
```

**⚠️ CRITICAL**: Replace `your-app.vercel.app` with your actual Vercel domain!

### Step 3: Deploy

1. Click **Create Web Service**
2. Wait 2-3 minutes for deployment
3. Copy your backend URL (e.g., `https://meta-drive-backend.onrender.com`)

### Step 4: Test Backend

Open: `https://your-backend.onrender.com/`

Should see:
```json
{
  "ok": true,
  "service": "KMRCL Backend v2.0",
  "status": "running",
  ...
}
```

✅ If you see this, backend is working!

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Click **Deploy** (don't configure yet)

### Step 2: Configure Environment Variables

After first deployment, go to **Settings** → **Environment Variables**

Add these variables:

```bash
# Backend URL (Replace with YOUR Render URL)
VITE_BACKEND_URL=https://meta-drive-backend.onrender.com

# Google Apps Script URL
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec

# Google Drive Folder ID
VITE_GOOGLE_DRIVE_FOLDER_ID=1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG
```

**⚠️ CRITICAL**: Replace `meta-drive-backend.onrender.com` with YOUR actual Render URL!

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes

### Step 4: Update Render CORS

Now that you have your Vercel URL:

1. Go back to Render dashboard
2. Update `ALLOWED_ORIGINS` to include your Vercel URL:
   ```bash
   ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app,http://localhost:8080
   ```
3. Click **Save Changes**
4. Wait for automatic redeploy (2-3 minutes)

---

## Part 3: Test Everything

### Test 1: Frontend Loads

1. Open your Vercel URL
2. Should see the KMRCL Metro dashboard
3. Check browser console (F12) - should be no errors

### Test 2: Folder Loading

1. Click on a folder in the left panel
2. Files should load in the middle panel
3. ✅ This tests Google Apps Script integration

### Test 3: AI Search

1. Type a query: "Find all documents"
2. Click "Document Details (AI)"
3. Should see AI response appear
4. ✅ This tests backend integration

---

## Troubleshooting

### "Cannot GET /" on Backend URL

✅ **FIXED!** Backend now has a root endpoint.

### "Search failed" / "Load failed"

**Likely causes:**
1. Wrong `VITE_BACKEND_URL` in Vercel
2. Wrong `ALLOWED_ORIGINS` in Render
3. Backend is sleeping (free tier)

**How to fix:**

1. Open browser console (F12)
2. Look for red errors
3. Check if URL matches:
   - Console shows: `🔍 Calling backend: https://...`
   - Should match your Render URL

**Check CORS:**
```bash
# In Render logs, look for:
⚠️ CORS blocked request from: https://...
```

If you see this, the Vercel URL in `ALLOWED_ORIGINS` is wrong.

**Check environment variables:**

Render:
```bash
echo $ALLOWED_ORIGINS
# Should include your Vercel URL
```

Vercel:
```bash
# In browser console:
console.log(import.meta.env.VITE_BACKEND_URL)
# Should be your Render URL
```

### Backend Sleeping (Free Tier)

Render free tier sleeps after 15 minutes of inactivity.

**Symptoms:**
- First request takes 30-60 seconds
- Timeout errors

**Solutions:**
1. Wait 60 seconds for first request
2. Upgrade to Starter plan ($7/month) for always-on service

### 502 Bad Gateway

**Cause:** Backend crashed or not running

**Fix:**
1. Check Render logs for errors
2. Ensure all environment variables are set
3. Redeploy manually

---

## Cost Breakdown

### Render Free Tier
- ✅ $0/month
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 750 hours/month limit

### Render Starter ($7/month)
- ✅ Always-on (no cold starts)
- ✅ Unlimited hours
- ✅ Better performance

### Vercel Hobby
- ✅ $0/month
- ✅ Perfect for this app

**Total Cost:** $0-7/month depending on Render tier

---

## Advanced: Enable Vertex AI (Optional)

For better OCR on technical drawings and circuit diagrams:

1. Create Google Cloud project
2. Enable Vertex AI API
3. Create service account
4. Add to Render environment variables:
   ```bash
   GOOGLE_CLOUD_PROJECT=your-project-id
   VERTEX_AI_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
   ```

**Cost:** ~$0.005 per document page

---

## Next Steps

1. ✅ Test all features
2. 📊 Monitor Render logs for errors
3. 🔐 Secure your API keys (don't commit to Git)
4. 📈 Upgrade Render if needed for production use

---

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Project Issues: Check `VERCEL_RENDER_FIX.md` for common problems
