from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import shutil
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
import razorpay


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
razorpay_client = razorpay.Client(auth=(os.environ['RAZORPAY_KEY_ID'], os.environ['RAZORPAY_KEY_SECRET']))

BUNDLE_FILE = ROOT_DIR / 'bundles.zip'
SOURCE_BUNDLE = ROOT_DIR / 'bundles'
if not BUNDLE_FILE.exists():
    shutil.make_archive(str(BUNDLE_FILE.with_suffix('')), 'zip', SOURCE_BUNDLE)

app = FastAPI()
api_router = APIRouter(prefix="/api")


class OrderRequest(BaseModel):
    bundle_id: str
    customer_email: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class BundleCreate(BaseModel):
    title: str
    description: str
    tag: str = "Prompt bundle"
    price: int = 299


@api_router.get("/")
async def root():
    return {"message": "PromptForge API online"}

@api_router.get("/bundles")
async def list_bundles():
    count = await db.bundles.count_documents({})
    if count == 0:
        seeds = [
            {"id": "ultimate-ai", "title": "Ultimate AI Prompt Vault", "description": "500 ready-to-use prompts for work, content and everyday AI wins.", "tag": "BESTSELLER", "price": 299},
            {"id": "song-creation", "title": "AI Song Creation Kit", "description": "Turn a blank idea into hooks, lyrics, genres and complete song concepts.", "tag": "CREATIVE", "price": 299},
            {"id": "video-editing", "title": "AI Video Editing Kit", "description": "Prompts for cuts, captions, reels, storytelling, sound design and more.", "tag": "CREATOR", "price": 299},
        ]
        await db.bundles.insert_many(seeds)
    return await db.bundles.find({}, {"_id": 0}).sort("title", 1).to_list(100)

@api_router.post("/orders")
async def create_order(payload: OrderRequest):
    bundle = await db.bundles.find_one({"id": payload.bundle_id}, {"_id": 0})
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    amount = int(bundle["price"]) * 100
    if amount < 100:
        raise HTTPException(status_code=400, detail="Amount must be at least 100 paise")
    receipt = f"pf_{uuid.uuid4().hex[:28]}"[:40]
    try:
        order = razorpay_client.order.create({"amount": amount, "currency": "INR", "receipt": receipt, "payment_capture": 1})
    except Exception as exc:
        logger.warning("Razorpay order creation failed: %s", exc)
        if "auth" in str(exc).lower():
            raise HTTPException(status_code=401, detail="Razorpay authentication failed")
        raise HTTPException(status_code=500, detail="Could not create payment order")
    await db.orders.insert_one({
        "id": str(uuid.uuid4()),
        "order_id": order["id"],
        "bundle_id": bundle["id"],
        "email": payload.customer_email,
        "amount": bundle["price"],
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}

@api_router.post("/payments/verify")
async def verify_payment(payload: VerifyPaymentRequest):
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
        })
    except Exception as exc:
        logger.warning("Razorpay verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Payment verification failed")
    order = await db.orders.find_one({"order_id": payload.razorpay_order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"order_id": payload.razorpay_order_id},
        {"$set": {"status": "paid", "payment_id": payload.razorpay_payment_id, "paid_at": now.isoformat()}},
    )
    token = secrets.token_urlsafe(32)
    await db.downloads.insert_one({
        "token": token,
        "order_id": payload.razorpay_order_id,
        "bundle_id": order["bundle_id"],
        "used": False,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=24)).isoformat(),
    })
    return {"success": True, "download_token": token}

@api_router.get("/download/{token}")
async def download_bundle(token: str):
    now = datetime.now(timezone.utc).isoformat()
    grant = await db.downloads.find_one_and_update(
        {"token": token, "used": False, "expires_at": {"$gt": now}},
        {"$set": {"used": True, "used_at": now}},
    )
    if not grant:
        raise HTTPException(status_code=403, detail="Download link is invalid, already used or expired")
    return FileResponse(BUNDLE_FILE, media_type="application/zip", filename="promptforge-bundles.zip")

@api_router.post("/admin/bundles")
async def add_bundle(bundle: BundleCreate, x_admin_key: Optional[str] = Header(default=None)):
    import hmac
    if not hmac.compare_digest(x_admin_key or "", os.environ["ADMIN_KEY"]):
        raise HTTPException(status_code=401, detail="Invalid admin key")
    doc = {"id": uuid.uuid4().hex[:10], **bundle.model_dump()}
    await db.bundles.insert_one(doc)
    return {key: value for key, value in doc.items() if key != "_id"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
