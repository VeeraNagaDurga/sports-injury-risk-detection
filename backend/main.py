from fastapi import UploadFile, File
import os
from utils.video_processing import extract_frames
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Models
# -----------------------------
class User(BaseModel):
    name: str
    email: str
    password: str


class AthleteProfile(BaseModel):
    athlete_id: str
    sport_type: str
    position: str
    age: int
    height: float
    weight: float
    injury_history: str
    training_load: str


# -----------------------------
# APIs
# -----------------------------
@app.get("/")
def home():
    return {
        "message": "Sports Injury Risk Detection API is Running"
    }


@app.post("/register")
def register(user: User):
    return {
        "message": "User Registered Successfully",
        "user": user
    }


@app.post("/login")
def login(email: str, password: str):
    return {
        "message": "Login Successful"
    }


@app.post("/athlete-profile")
def save_profile(profile: AthleteProfile):
    return {
        "message": "Athlete Profile Saved Successfully",
        "profile": profile
    }
@app.post("/upload-video")
async def upload_video(video: UploadFile = File(...)):

    upload_folder = "uploads"

    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, video.filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await video.read())

    total_frames = extract_frames(file_path)

    return {
        "message": "Video Uploaded Successfully",
        "filename": video.filename,
        "total_frames": total_frames
    }