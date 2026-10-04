from fastapi import FastAPI, APIRouter, HTTPException, Header, UploadFile, File, Form
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import razorpay
import hmac
import hashlib
import shutil


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
razorpay_client = razorpay.Client(auth=(os.environ['RAZORPAY_KEY_ID'], os.environ['RAZORPAY_KEY_SECRET']))
BUNDLE_FILE = ROOT_DIR / 'bundles.zip'
SOURCE_BUNDLE = ROOT_DIR / 'bundles'
if not BUNDLE_FILE.exists():
    shutil.make_archive(str(BUNDLE_FILE.with_suffix('')), 'zip', SOURCE_BUNDLE)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

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

# Add your routes to the router instead of directly to app
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
    receipt = f"pf_{uuid.uuid4().hex[:28]}"[:40]
    order = razorpay_client.order.create({"amount": int(bundle["price"]) * 100, "currency": "INR", "receipt": receipt, "payment_capture": 1})
    await db.orders.insert_one({"id": str(uuid.uuid4()), "order_id": order["id"], "bundle_id": bundle["id"], "email": payload.customer_email, "amount": bundle["price"], "status": "created", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"], "key_id": os.environ["RAZORPAY_KEY_ID"]}

@api_router.post("/payments/verify")
async def verify_payment(payload: VerifyPaymentRequest):
    try:
        razorpay_client.utility.verify_payment_signature({"razorpay_order_id": payload.razorpay_order_id, "razorpay_payment_id": payload.razorpay_payment_id, "razorpay_signature": payload.razorpay_signature})
    except Exception as exc:
        logger.warning("Razorpay verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Payment verification failed")
    order = await db.orders.find_one({"order_id": payload.razorpay_order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.orders.update_one({"order_id": payload.razorpay_order_id}, {"$set": {"status": "paid", "payment_id": payload.razorpay_payment_id}})
    return {"success": True, "download_url": f"/api/download/{order['bundle_id']}?order_id={payload.razorpay_order_id}"}

@api_router.get("/download/{bundle_id}")
async def download_bundle(bundle_id: str, order_id: str):
    order = await db.orders.find_one({"order_id": order_id, "bundle_id": bundle_id, "status": "paid"}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=403, detail="Complete payment before downloading")
    return FileResponse(BUNDLE_FILE, media_type="application/zip", filename="promptforge-bundles.zip")

@api_router.post("/admin/bundles")
async def add_bundle(bundle: BundleCreate, x_admin_key: Optional[str] = Header(default=None)):
    if not hmac.compare_digest(x_admin_key or "", os.environ["ADMIN_KEY"]):
        raise HTTPException(status_code=401, detail="Invalid admin key")
    slug = uuid.uuid4().hex[:10]
    doc = {"id": slug, **bundle.model_dump()}
    await db.bundles.insert_one(doc)
    return {key: value for key, value in doc.items() if key != "_id"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()