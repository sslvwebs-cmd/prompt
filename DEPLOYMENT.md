# PromptForge — Static Hosting Guide (Hostinger only, no backend)

The store is now 100% static: the bundle catalog lives in code, Razorpay checkout runs in the
browser, and the paid ZIP ships inside the site itself. No Render, no MongoDB, no Python.

IMPORTANT TRADE-OFF (read once):
Payment is confirmed in the browser only. The ZIP sits at a hidden, unguessable URL
(/downloads/promptforge-vault-7f3a9c.zip) and downloads right after a successful payment —
but anyone who discovers that URL can download without paying. For a ₹299 digital product this
is a common, pragmatic setup. If you later need cryptographically verified downloads, the
unused secure backend still exists in the backend/ folder (see git history for the Render guide).

--------------------------------------------------------------------------------
STEP 1 — Set your Razorpay public key
--------------------------------------------------------------------------------
Edit frontend/.env.production:
  REACT_APP_RAZORPAY_KEY_ID = your PUBLIC key (rzp_test_... for testing, rzp_live_... for real money)
Get it from Razorpay Dashboard → Settings → API Keys.
Note: the Test keys used during development were rejected by Razorpay ("Authentication failed") —
generate a FRESH Test key pair and use the new Key ID here.
Only the Key ID is ever used — this static setup never needs the secret.

--------------------------------------------------------------------------------
STEP 2 — Build and upload
--------------------------------------------------------------------------------
  cd frontend
  yarn install
  yarn build
Upload the CONTENTS of frontend/build/ to Hostinger (public_html).
The build already includes:
  - your products (from frontend/src/data/bundles.js)
  - the paid ZIP (frontend/public/downloads/ → /downloads/ on your domain)
If Hostinger builds from GitHub: commit .env.production (it holds only the public key — safe)
and the public/downloads/ folder, then trigger a rebuild.

--------------------------------------------------------------------------------
STEP 3 — Verify
--------------------------------------------------------------------------------
1. Open https://prompts.renderedge.life — all bundles appear instantly (no loading state).
2. "Get the vault" → enter an email → Razorpay modal opens.
3. Test Mode card: 4111 1111 1111 1111, any future expiry, any CVV, any name.
4. After payment, a "Payment confirmed" screen appears with the download button.
5. Direct check: https://prompts.renderedge.life/downloads/promptforge-vault-7f3a9c.zip
   should download the ZIP (keep this URL private — it is the product).

--------------------------------------------------------------------------------
ADDING / EDITING BUNDLES (no admin panel in static mode)
--------------------------------------------------------------------------------
1. Open frontend/src/data/bundles.js
2. Add an entry: { id: "my-new-kit", title: "...", description: "...", tag: "NEW", price: 299 }
   The first entry in the list becomes the large featured card.
3. yarn build → re-upload the build folder.
If a bundle should deliver a DIFFERENT file, add another ZIP to frontend/public/downloads/
and tell the store which file each bundle uses (ask me to add per-bundle files).

--------------------------------------------------------------------------------
GOING LIVE WITH REAL MONEY
--------------------------------------------------------------------------------
1. Razorpay Dashboard → switch to Live Mode → generate Live keys.
2. Put the rzp_live_... Key ID in frontend/.env.production.
3. Complete Razorpay KYC/activation if prompted.
4. Rebuild + re-upload.
