# 🚨 URGENT FIX: Vercel + Render Connection Issue

## Problem
Your Vercel frontend shows "Search failed" and "Load failed" errors because:
1. Backend CORS is blocking Vercel's domain
2. Vercel environment variables may not be configured
3. Backend URL might be incorrect

## Quick Diagnosis

### Test 1: Check Backend is Running

Open your Render URL in a browser:
```
https://your-backend.onrender.com/
```

**Expected response:**
```json
{
  "ok": true,
  "service": "KMRCL Backend v2.0",
  "status": "running"
}
```

✅ If you see this: Backend is working!
❌ If you see "Cannot GET /": Update your code (fixed in latest version)
❌ If timeout/502: Backend is crashed or sleeping

### Test 2: Check CORS in Browser Console

1. Open your Vercel app
2. Press F12 (open DevTools)
3. Go to **Console** tab
4. Try an AI search
5. Look for:
   - `🔍 Calling backend: https://...` (should match your Render URL)
   - Red CORS errors mentioning `Access-Control-Allow-Origin`

### Test 3: Check Network Requests

1. In DevTools, go to **Network** tab
2. Try an AI search
3. Look for requests to `/ask` or `/search-multi`
4. Click on the failed request
5. Check the URL - does it match your Render URL?

## Quick Fix (5 minutes)

### Step 1: Update Render Environment Variables

1. Go to https://dashboard.render.com/
2. Select your backend service
3. Go to **Environment** tab
4. **Update or add** these variables:

```bash
GEMINI_API_KEY=AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk
ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app
NODE_ENV=production
PORT=10000
```

**CRITICAL**: Replace `your-actual-vercel-url.vercel.app` with your REAL Vercel URL!

**Finding your Vercel URL:**
- Go to Vercel Dashboard → Your Project
- Look for "Domains" section
- Copy the URL (e.g., `meta-drive-spark.vercel.app`)

**Multiple domains example:**
```bash
ALLOWED_ORIGINS=https://meta-drive-spark.vercel.app,https://meta-drive-spark-git-main.vercel.app,http://localhost:8080
```

4. Click **Save Changes**
5. Wait for Render to redeploy (automatic, 2-3 minutes)

---

### Step 2: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. **Add or update** these variables:

```bash
VITE_BACKEND_URL=https://your-render-service.onrender.com
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
VITE_GOOGLE_DRIVE_FOLDER_ID=1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG
```

**CRITICAL**: Replace `your-render-service.onrender.com` with your REAL Render URL!

**Finding your Render URL:**
- Go to Render Dashboard → Your Service
- Top of page shows URL (e.g., `meta-drive-backend.onrender.com`)

5. Click **Save**
6. Go to **Deployments** tab
7. Click **Redeploy** on the latest deployment

---

### Step 3: Test

1. Wait 2-3 minutes for both to redeploy
2. Open your Vercel app in browser
3. Open Browser Console (F12)
4. Try AI search
5. Check for errors in Console tab

**If still not working:**
- Check Network tab in browser DevTools
- Look for request to your backend URL
- Check if response has CORS error

---

## Example Configuration

**If your URLs are:**
- Backend: `https://meta-drive-backend.onrender.com`
- Frontend: `https://meta-drive-spark.vercel.app`

**Then in Render:**
```bash
GEMINI_API_KEY=AIzaSyDCebqwZVLQo0c0hlNCFIoD-YrpOOcTpDk
ALLOWED_ORIGINS=https://meta-drive-spark.vercel.app
NODE_ENV=production
PORT=10000
```

**And in Vercel:**
```bash
VITE_BACKEND_URL=https://meta-drive-backend.onrender.com
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
VITE_GOOGLE_DRIVE_FOLDER_ID=1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG
```

---

## Troubleshooting

### Still getting "Search failed"?

**Check Render Logs:**
1. Go to Render Dashboard → Your Service → Logs
2. Look for: `⚠️ CORS blocked request from: https://...`
3. If you see this, the Vercel URL in `ALLOWED_ORIGINS` is wrong

**Check Vercel Console:**
1. Open your Vercel app
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for CORS errors mentioning `Access-Control-Allow-Origin`

### Getting 502 Bad Gateway?

**Render Free Tier Limitation:**
- Free tier services "sleep" after 15 minutes of inactivity
- First request takes 30-60 seconds to "wake up"
- Solution: Upgrade to Starter plan ($7/month) for always-on service

### Backend URL in browser returns error?

**Test backend health:**
```bash
curl https://your-render-service.onrender.com/health
```

Should return:
```json
{"ok":true,"status":"healthy","stats":{...}}
```

If this fails:
1. Check Render service is running (Dashboard shows "Live")
2. Check logs for startup errors
3. Verify environment variables are set

---

## Why This Happened

**CORS (Cross-Origin Resource Sharing)** is a security feature that blocks requests from different domains. Your backend was configured to only accept requests from `FRONTEND_URL`, which was probably set to localhost or Netlify.

The code update changes this to `ALLOWED_ORIGINS` which accepts multiple domains (Vercel, localhost, custom domains) for more flexibility.

---

## Next Steps After Fix

Once working, consider:

1. **Add all Vercel domains** to `ALLOWED_ORIGINS`:
   - Main domain: `app.vercel.app`
   - Git branch previews: `app-git-main.vercel.app`
   - Custom domains: `customdomain.com`

2. **Upgrade Render** to paid tier ($7/month) for:
   - Always-on service (no cold starts)
   - Better performance
   - More reliable for production

3. **Monitor logs** regularly:
   - Render: Check for errors and CORS blocks
   - Vercel: Check deployment logs and function logs

---

## Need More Help?

Check these detailed guides:
- `RENDER_DEPLOYMENT_CHECKLIST.md` - Full Render setup
- `RAILWAY_DEPLOYMENT_SUMMARY.md` - Railway alternative
- `backend/RAILWAY_SETUP.md` - Railway specific setup
