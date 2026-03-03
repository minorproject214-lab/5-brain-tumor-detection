import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import warnings
warnings.filterwarnings('ignore')

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from typing import List
import numpy as np
from PIL import Image
import io, base64
from datetime import datetime
from bson import ObjectId
import tensorflow as tf

from database import users_collection, sessions_collection
from schemas import UserRegister, UserLogin
from auth import hash_password, verify_password, create_access_token, decode_token
from dotenv import load_dotenv

load_dotenv()

# ---------- Load Model ----------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "brain-tumor-model.h5")
model = None

class FixedInputLayer(tf.keras.layers.InputLayer):
    @classmethod
    def from_config(cls, config):
        if 'batch_shape' in config:
            config['input_shape'] = config.pop('batch_shape')[1:]
        return cls(**config)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print("Loading model...")
    with tf.keras.utils.custom_object_scope({'InputLayer': FixedInputLayer}):
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("Model loaded!")
    yield
    print("Shutting down...")

app = FastAPI(title="NeuroScan API", version="1.0.0", lifespan=lifespan)

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Auth Dependency ----------
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ---------- Classes ----------
CLASSES = ["Glioma", "Meningioma", "No Tumor", "Pituitary Tumor"]

CLASS_INFO = {
    "Glioma": {
        "description": "Gliomas are tumors that arise from glial cells in the brain or spine. They are among the most common primary brain tumors.",
        "severity": "High",
        "color": "#ef4444"
    },
    "Meningioma": {
        "description": "Meningiomas arise from the meninges — the membranes surrounding the brain and spinal cord. Most are benign and slow-growing.",
        "severity": "Medium",
        "color": "#f97316"
    },
    "No Tumor": {
        "description": "No tumor detected in the MRI scan. The brain appears normal with no signs of abnormal growth.",
        "severity": "None",
        "color": "#22c55e"
    },
    "Pituitary Tumor": {
        "description": "Pituitary tumors form in the pituitary gland at the base of the brain. Most are benign (adenomas) and treatable.",
        "severity": "Medium",
        "color": "#a855f7"
    }
}

# ---------- Helper ----------
def predict_image(contents: bytes):
    img = Image.open(io.BytesIO(contents)).convert("L")
    img = img.resize((300, 300))
    img_array = np.array(img) / 255.0
    img_array = img_array.reshape(1, 300, 300, 1)
    pred = model.predict(img_array, verbose=0)
    predicted_index = int(np.argmax(pred[0]))
    predicted_class = CLASSES[predicted_index]
    confidence = float(np.max(pred[0])) * 100
    raw = [round(float(x) * 100, 4) for x in pred[0]]
    return predicted_class, confidence, raw

# ---------- Routes ----------

@app.get("/")
async def root():
    return {"message": "NeuroScan API is running"}


@app.post("/auth/register")
async def register(body: UserRegister):
    existing = await users_collection.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(body.password)
    new_user = {
        "name": body.name,
        "email": body.email,
        "password": hashed,
        "created_at": datetime.utcnow()
    }
    result = await users_collection.insert_one(new_user)
    token = create_access_token({"sub": str(result.inserted_id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(result.inserted_id), "name": body.name, "email": body.email}
    }


@app.post("/auth/login")
async def login(body: UserLogin):
    user = await users_collection.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}
    }


@app.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"]
    }


# ---------- Predict single (used internally per file in batch) ----------
@app.post("/predict")
async def predict(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    """Single image predict — used by Upload page per image, does NOT save session."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    contents = await file.read()
    predicted_class, confidence, raw = predict_image(contents)
    img_b64 = base64.b64encode(contents).decode("utf-8")
    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "raw_prediction": raw,
        "class_info": CLASS_INFO[predicted_class],
        "all_classes": CLASSES,
        "filename": file.filename,
        "image_base64": img_b64,
    }


# ---------- Save session (called after all images analyzed) ----------
@app.post("/sessions")
async def save_session(body: dict, current_user=Depends(get_current_user)):
    """
    Save a batch session to MongoDB.
    Body: { session_name: str, scans: [ { filename, predicted_class, confidence, raw_prediction, class_info, image_base64 } ] }
    """
    scans = body.get("scans", [])
    if not scans:
        raise HTTPException(status_code=400, detail="No scans provided")

    # Build summary
    summary = {cls: 0 for cls in CLASSES}
    for scan in scans:
        cls = scan.get("predicted_class")
        if cls in summary:
            summary[cls] += 1

    session = {
        "user_id": str(current_user["_id"]),
        "session_name": body.get("session_name", f"Session {datetime.utcnow().strftime('%d %b %Y, %H:%M')}"),
        "scans": scans,
        "summary": summary,
        "total": len(scans),
        "created_at": datetime.utcnow()
    }
    result = await sessions_collection.insert_one(session)
    return {"id": str(result.inserted_id), "message": "Session saved"}


# ---------- Get all sessions ----------
@app.get("/sessions")
async def get_sessions(current_user=Depends(get_current_user)):
    cursor = sessions_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1)

    sessions = []
    async for doc in cursor:
        sessions.append({
            "id": str(doc["_id"]),
            "session_name": doc.get("session_name", "Untitled Session"),
            "total": doc.get("total", 0),
            "summary": doc.get("summary", {}),
            "scans": doc.get("scans", []),
            "created_at": doc["created_at"].isoformat()
        })
    return sessions


# ---------- Delete session ----------
@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user=Depends(get_current_user)):
    result = await sessions_collection.delete_one({
        "_id": ObjectId(session_id),
        "user_id": str(current_user["_id"])
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}