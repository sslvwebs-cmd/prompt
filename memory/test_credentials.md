# Test Credentials

## App (creator console)
- Admin key (X-Admin-Key header / prompt in Creator console): `prompt-store-admin-2026`
- No user login system exists.

## Razorpay (Test Mode)
- Keys live ONLY in `backend/.env` (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) and `frontend/.env` (REACT_APP_RAZORPAY_KEY_ID, public key only). Never copy the secret here.
- STATUS: the stored test pair was REJECTED by Razorpay ("Authentication failed") on 2026-10-04. Awaiting a fresh pair from the user.
