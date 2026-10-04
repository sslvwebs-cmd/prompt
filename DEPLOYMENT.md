# PromptForge — Deployment Guide (secure server-verified checkout)

CURRENT ARCHITECTURE (2026-10-04): payments are server-verified again. The storefront is
static-hostable, but checkout requires the FastAPI backend for order creation, HMAC signature
verification and one-time ZIP downloads. Hostinger alone is NOT enough for payments.

  prompts.renderedge.life (Hostinger, static React build)
      -> https://YOUR-RENDER-APP.onrender.com/api (Render, FastAPI backend from /backend)
          -> MongoDB Atlas (database)

--------------------------------------------------------------------------------
STEP 1 — MongoDB Atlas (free)
--------------------------------------------------------------------------------
1. https://cloud.mongodb.com → create a free M0 cluster.
2. Database Access → Add Database User (save username + password).
3. Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0).
4. Connect → Drivers → copy the connection string:
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/

--------------------------------------------------------------------------------
STEP 2 — Backend on Render (free)
--------------------------------------------------------------------------------
1. Push this repo to GitHub. Make sure backend/bundles.zip and backend/bundles/
   ARE committed — they are the paid product files.
2. https://render.com → New → Web Service → same GitHub repo:
   - Root Directory: backend
   - Build Command: pip install -r requirements-external.txt
   - Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
   - Health Check Path: /api/
   (backend/render.yaml is a ready Blueprint alternative.)
3. Environment variables on Render:
   - MONGO_URL = Atlas connection string (Step 1)
   - DB_NAME = promptforge
   - RAZORPAY_KEY_ID = your Razorpay Key ID
   - RAZORPAY_KEY_SECRET = the matching secret (NEVER commit to GitHub)
   - ADMIN_KEY = a strong value of your choice (Creator console)
   - CORS_ORIGINS = https://prompts.renderedge.life
4. Verify: curl https://YOUR-RENDER-APP.onrender.com/api/bundles
   First call auto-seeds the 3 starter bundles. Free tier sleeps when idle (~30-60s
   cold start); the storefront retries automatically.

--------------------------------------------------------------------------------
STEP 3 — Frontend on Hostinger
--------------------------------------------------------------------------------
1. Edit frontend/.env.production:
     REACT_APP_BACKEND_URL=https://YOUR-RENDER-APP.onrender.com
     REACT_APP_RAZORPAY_KEY_ID=<public Key ID only>
   (both values are public-safe to commit)
2. Build:  cd frontend && yarn install && yarn build
3. Upload the CONTENTS of frontend/build/ to Hostinger public_html.
   If Hostinger builds from GitHub, commit the filled .env.production and rebuild.

--------------------------------------------------------------------------------
STEP 4 — Verify the full flow
--------------------------------------------------------------------------------
1. Site loads, bundles appear.
2. "Get the vault" → email → Razorpay modal (Test Mode badge) opens.
3. Test card: 4111 1111 1111 1111, any future expiry, any CVV.
4. After payment: server verifies the signature, then the "Payment verified" screen
   shows a one-time download button (link valid 24h, single use).

--------------------------------------------------------------------------------
ADDING BUNDLES
--------------------------------------------------------------------------------
- Live/preview with backend running: use the Creator console (if re-enabled) or insert
  into the bundles collection.
- Static catalog edit: frontend/src/data/bundles.js → add entry → rebuild.
  NOTE: the catalog shown on the site comes from src/data/bundles.js, while the backend
  validates bundle ids against MongoDB (seeded with the same 3 ids). Keep ids in sync.

--------------------------------------------------------------------------------
GOING LIVE WITH REAL MONEY
--------------------------------------------------------------------------------
1. Razorpay Dashboard → Live Mode → generate Live keys (complete KYC if prompted).
2. Update RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET on Render and REACT_APP_RAZORPAY_KEY_ID
   in frontend/.env.production → rebuild + re-upload frontend.
