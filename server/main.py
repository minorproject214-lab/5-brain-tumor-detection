from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from datetime import datetime
from bson import ObjectId

from database import users_collection, sessions_collection
from schemas import UserRegister, UserLogin
from auth import hash_password, verify_password, create_access_token, decode_token
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NeuroScan API", version="1.0.0")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Auth ----------
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


@app.post("/sessions")
async def save_session(body: dict, current_user=Depends(get_current_user)):
    scans = body.get("scans", [])
    if not scans:
        raise HTTPException(status_code=400, detail="No scans provided")

    CLASSES = ["Glioma", "Meningioma", "No Tumor", "Pituitary Tumor"]
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


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user=Depends(get_current_user)):
    result = await sessions_collection.delete_one({
        "_id": ObjectId(session_id),
        "user_id": str(current_user["_id"])
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}