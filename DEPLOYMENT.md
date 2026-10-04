# PromptForge — External Hosting Guide (Hostinger frontend + Render backend + MongoDB Atlas)

Why this is needed: Hostinger static hosting only serves the React build. The store's API
(bundles, Razorpay orders, payment verification, ZIP download) is a FastAPI + MongoDB app and
must run on a server. The live site currently 404s on /api/bundles because no backend exists there,
and the frontend was built without REACT_APP_BACKEND_URL (the built JS calls "undefined/api/bundles").

Architecture after this guide:
  prompts.renderedge.life (Hostinger, static React build)
      -> https://YOUR-RENDER-APP.onrender.com/api (Render, FastAPI)
          -> MongoDB Atlas (database)

--------------------------------------------------------------------------------
STEP 1 — MongoDB Atlas (free)
--------------------------------------------------------------------------------
1. Go to https://cloud.mongodb.com → create a free M0 cluster.
2. Database Access → Add Database User → username + password (save these).
3. Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0).
   (Render has dynamic IPs; this is required.)
4. Connect → Drivers → copy the connection string, it looks like:
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/
   Replace <user>/<password> with the ones from step 2.

--------------------------------------------------------------------------------
STEP 2 — Backend on Render (free)
--------------------------------------------------------------------------------
1. Push this repo to GitHub (make sure backend/bundles.zip and the backend/bundles/
   folder ARE committed — they are the paid product files).
2. https://render.com → New → Web Service → connect the same GitHub repo.
3. Settings:
   - Root Directory: backend
   - Build Command: pip install -r requirements-external.txt
   - Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
   - Health Check Path: /api/
   (A ready-made backend/render.yaml blueprint is included if you prefer "New → Blueprint".)
4. Environment → add these variables:
   - MONGO_URL = your Atlas connection string from Step 1
   - DB_NAME = promptforge
   - RAZORPAY_KEY_ID = rzp_test_... (from Razorpay Dashboard → Settings → API Keys)
   - RAZORPAY_KEY_SECRET = the matching secret (NEVER commit this to GitHub)
   - ADMIN_KEY = pick a strong value (used by the Creator console)
   - CORS_ORIGINS = https://prompts.renderedge.life
5. Deploy. When live, verify:
   curl https://YOUR-RENDER-APP.onrender.com/api/bundles
   The first call auto-seeds the 3 starter bundles into Atlas.
   Note: Render's free tier sleeps when idle — the first request after idle can take
   ~30-60s. The storefront already retries automatically while it wakes.

--------------------------------------------------------------------------------
STEP 3 — Frontend on Hostinger
--------------------------------------------------------------------------------
1. Edit frontend/.env.production:
   - REACT_APP_BACKEND_URL = https://YOUR-RENDER-APP.onrender.com  (no trailing slash)
   - REACT_APP_RAZORPAY_KEY_ID = your PUBLIC Razorpay key (rzp_test_... / rzp_live_...)
2. Build locally (or wherever you build):
   cd frontend
   yarn install
   yarn build        # CRA automatically loads .env.production for builds
3. Upload the CONTENTS of frontend/build/ to Hostinger (public_html).
   If Hostinger builds from GitHub instead, commit the filled-in .env.production
   (it contains only public values — safe) and trigger a rebuild.
4. Open https://prompts.renderedge.life — bundles should appear.

--------------------------------------------------------------------------------
STEP 4 — Verify the full flow
--------------------------------------------------------------------------------
- /api/bundles returns your bundles (run the curl above).
- Click "Get the vault" → enter email → Razorpay modal opens (Test Mode: use card
  4111 1111 1111 1111, any future expiry, any CVV).
- After payment, the ZIP downloads automatically (one-time link, valid 24h).

Safety notes:
- The Razorpay SECRET lives only in Render env vars. The frontend only ever holds the public key.
- Switching to real money later: generate LIVE keys in Razorpay, update RAZORPAY_KEY_ID /
  RAZORPAY_KEY_SECRET in Render and REACT_APP_RAZORPAY_KEY_ID in .env.production, rebuild frontend.
- Admin key for the Creator console on the live site is whatever you set as ADMIN_KEY on Render
  (preview used prompt-store-admin-2026 — set a different, stronger one for production).
