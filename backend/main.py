from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from pathlib import Path

app = FastAPI()

# Add CORS middleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Simple in-memory user storage (for demo purposes)
users_db = {}

# Pydantic models
class User(BaseModel):
    name: str = None
    email: str
    password: str
    role: str = "Athlete"

class LoginRequest(BaseModel):
    email: str
    password: str

class AthleteProfile(BaseModel):
    athlete_id: str
    sport_type: str
    position: str
    age: str
    height: str
    weight: str
    injury_history: str
    training_load: str

# Simple in-memory athlete storage (for demo purposes)
athlete_db = {}

# Routes
@app.get("/")
async def root():
    return {"message": "Sports Injury Risk Detection API"}

@app.post("/register")
async def register(user: User):
    """Register a new user"""
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    users_db[user.email] = {
        "name": user.name,
        "email": user.email,
        "password": user.password,
        "role": user.role
    }
    
    return {"message": f"User {user.name} registered successfully"}

@app.post("/login")
async def login(credentials: LoginRequest):
    """Login user"""
    if credentials.email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = users_db[credentials.email]
    if user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "message": "Login successful",
        "user": {
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@app.post("/athlete-profile")
async def save_athlete_profile(profile: AthleteProfile):
    """Save athlete profile"""
    try:
        athlete_db[profile.athlete_id] = {
            "athlete_id": profile.athlete_id,
            "sport_type": profile.sport_type,
            "position": profile.position,
            "age": profile.age,
            "height": profile.height,
            "weight": profile.weight,
            "injury_history": profile.injury_history,
            "training_load": profile.training_load
        }
        
        return {
            "message": f"Athlete profile for {profile.athlete_id} saved successfully",
            "profile": athlete_db[profile.athlete_id]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/athlete-profile/{athlete_id}")
async def get_athlete_profile(athlete_id: str):
    """Get athlete profile"""
    if athlete_id not in athlete_db:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    
    return {"profile": athlete_db[athlete_id]}

@app.post("/upload-video")
async def upload_video(video: UploadFile = File(...)):
    """Upload and process a sports video"""
    try:
        file_path = UPLOAD_DIR / video.filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        return {"message": f"Video {video.filename} uploaded successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
