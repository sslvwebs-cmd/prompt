# PromptForge — PRD

## Original problem statement
Build a website to sell prompt bundles online for ₹299 each, with Razorpay payments, the ability to add more bundles later, and delivery of the uploaded `bundels.zip` archive to customers after successful payment. Latest explicit requirement: complete Razorpay Standard Web Checkout with Test credentials — backend create-order endpoint, frontend Razorpay modal, backend HMAC-SHA256 signature verification, correct error handling, and no secret on the frontend.

## Architecture
- CURRENT (server-verified, restored 2026-10-04 with fresh working Test keys): React static-hostable storefront + FastAPI backend (`/api/orders` = create-order, `/api/payments/verify` = HMAC-SHA256 verify via Razorpay SDK, `/api/download/{token}` = one-time 24h ZIP link, `/api/bundles`, `/api/admin/bundles` with X-Admin-Key). MongoDB via `MONGO_URL`/`DB_NAME` (collections: bundles, orders, downloads). Catalog displayed from `frontend/src/data/bundles.js` (static) while backend validates bundle ids against MongoDB seeds — keep ids in sync.
- Razorpay keys (WORKING, verified 2026-10-04): in `backend/.env` (id+secret) and `frontend/.env` + `.env.production` (public id only). Old rejected pair replaced.
- The public static ZIP hole (frontend/public/downloads) was REMOVED when server-verified checkout was restored; downloads now only via one-time token.
- Design: framer-motion + Lenis, acid-green cyberpunk, bento grid, custom bolt logo/favicon.

## User personas
- Buyer: wants a prompt bundle fast; pays ₹299 once via Razorpay; expects instant ZIP download.
- Seller (site owner): adds new bundles at ₹299 through the creator console.

## Core requirements (static)
1. Storefront listing prompt bundles at ₹299.
2. Razorpay Standard Checkout: server-created orders, browser modal with public key only, server-side HMAC-SHA256 signature verification (constant-time), 400 on invalid signature, 401 on Razorpay auth errors, 500 on operational errors.
3. Paid download gated behind a verified payment, via one-time download token (24h expiry).
4. Ability to add more bundles later.
5. Secret key never on frontend; env files git-ignored.

## Implemented
- 2026-10-04 (earlier session): storefront UI, 3 seed bundles, bundle list API, initial Razorpay flow, SDK installed.
- 2026-10-04: Hardened payment backend — `POST /api/orders` (amount >= 100 paise validation, 401/500 error mapping, returns only order_id/amount/currency), `POST /api/payments/verify` (SDK HMAC verify, 400 on failure, issues one-time download token, marks order paid), `GET /api/download/{token}` (atomic one-time use, 24h expiry, 403 otherwise).
- 2026-10-04: Full bold redesign — kinetic masked-line hero with parallax clipped-frame imagery, editorial marquee, bento vault grid, custom SVG bolt logo + favicon, Lenis momentum scrolling, framer-motion reveals, noise overlay, acid-green art direction. Components split into Nav/Hero/Marquee/VaultGrid/HowItWorks/Footer/CheckoutModal/AdminModal.
- 2026-10-04: Frontend checkout rewrite — loads checkout.js, creates order first, modal with `REACT_APP_RAZORPAY_KEY_ID`, sends all three signature fields, payment.failed + dismiss handlers, redirects to token download on success.
- 2026-10-04: `/app/.gitignore` covers `.env` files.
- 2026-10-04: Fixed "bundles not loading" — root cause was a transient fetch failure during service restarts with no retry; bundle fetch now auto-retries 3 times (1.5s apart) before showing the error toast. Independently verified: 4 cards render, no error toast.
- 2026-10-04: Deleted leftover TEST regression bundle (id b3ac0b7e63); vault shows 3 real products. Bento grid now stretches a lone last-row card to full width so the layout stays aligned for any bundle count.

## Verification status
- Verified: invalid signature → 400; invalid/used token → 403; unknown bundle → 404; Razorpay auth error → 401 (proven live); page renders at 375/768/1366 px; checkout modal opens.
- BLOCKED: live order creation fails — Razorpay rejects the stored Test keys ("Authentication failed"). Awaiting a fresh Test key pair from the user. End-to-end payment → verify → download test pending.

## Backlog
- P0: Wire fresh Razorpay Test keys, run full payment flow, then finish.
- P0 (user environment): Live site on Hostinger (prompts.renderedge.life) 404s on /api/bundles — static host has no backend and the frontend was built without REACT_APP_BACKEND_URL ("undefined/api" baked in). User chose: keep Hostinger for frontend, run backend externally. Provided: backend/requirements-external.txt (lean deps), backend/render.yaml (Blueprint), frontend/.env.production (template — user must fill Render URL), /app/DEPLOYMENT.md (Atlas → Render → Hostinger step-by-step). User must execute the guide; preview remains fully working meanwhile.
- P1: Real Test Mode payment via Razorpay test card, incl. cancellation/failure UX check.
- P1: Secure creator console properly (user chose to leave it open in preview for now; currently gated by `X-Admin-Key` prompt).
- P2: Razorpay webhook with signature validation for payment reconciliation.
- P2: Per-bundle downloadable assets instead of one shared ZIP.
- P2: Protected seller dashboard (edit/archive bundles, upload per-bundle files).

## Next tasks
1. Receive fresh Test Key ID + Secret → update `backend/.env` and `frontend/.env` → restart frontend.
2. `POST /api/orders` returns real Razorpay order id.
3. Simulate valid signature locally (HMAC with secret) → verify returns download_token → download serves ZIP once, second hit 403.
4. Browser: full checkout click-through in Test Mode.
