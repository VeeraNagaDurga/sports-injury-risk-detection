from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

try:
    from backend.utils.video_processing import detect_pose, validate_video
except ModuleNotFoundError:
    # Support running with different PYTHONPATH or working dir setups
    # older imports used `from utils.video_processing` which can fail
    # when running as a package; try the alternate import as a fallback.
    from utils.video_processing import detect_pose, validate_video

app = FastAPI()

# ----------------------------------------------------
# CORS Configuration
# ----------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    # During development allow all origins so frontend (localhost, 127.0.0.1,
    # network IPs) can reach the API without CORS issues. Change to a
    # restricted list in production.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Models
# ----------------------------------------------------

class User(BaseModel):
    name: str
    email: str
    password: str
    role: str


class LoginUser(BaseModel):
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


# ----------------------------------------------------
# Home API
# ----------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Sports Injury Risk Detection API is Running"
    }


# ----------------------------------------------------
# User Registration
# ----------------------------------------------------

@app.post("/register")
def register(user: User):
    return {
        "message": "User Registered Successfully",
        "user": {
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


# ----------------------------------------------------
# User Login
# ----------------------------------------------------

@app.post("/login")
def login(user: LoginUser):
    return {
        "message": "Login Successful",
        "email": user.email,
        "role": "Athlete"
    }


# ----------------------------------------------------
# Athlete Profile
# ----------------------------------------------------

@app.post("/athlete-profile")
def save_profile(profile: AthleteProfile):
    return {
        "message": "Athlete Profile Saved Successfully",
        "profile": profile
    }


# ----------------------------------------------------
# Video Upload & Processing
# ----------------------------------------------------

@app.post("/upload-video")
async def upload_video(video: UploadFile = File(...)):

    # ---------------------------------------
    # Validate File Extension
    # ---------------------------------------

    allowed_extensions = [".mp4", ".avi", ".mov"]

    extension = os.path.splitext(video.filename)[1].lower()

    if extension not in allowed_extensions:
        return {
            "message": "Invalid video format. Please upload MP4, AVI or MOV."
        }

    # ---------------------------------------
    # Validate File Size
    # ---------------------------------------

    content = await video.read()

    max_size = 100 * 1024 * 1024  # 100 MB

    if len(content) > max_size:
        return {
            "message": "Video size exceeds 100 MB."
        }

    # Reset pointer after reading
    await video.seek(0)

    # ---------------------------------------
    # Create Upload Folder
    # ---------------------------------------

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, video.filename)

    # ---------------------------------------
    # Save Uploaded Video
    # ---------------------------------------

    with open(file_path, "wb") as buffer:
        buffer.write(await video.read())

    # ---------------------------------------
    # Validate Video Quality
    # ---------------------------------------

    if not validate_video(file_path):
        return {
            "message": "Uploaded video is corrupted or cannot be processed."
        }

    # ---------------------------------------
    # Pose Detection
    # ---------------------------------------

    total_frames, detected_frames, landmarks = detect_pose(file_path)

    # ---------------------------------------
    # Response
    # ---------------------------------------

    return {
        "message": "Video Uploaded Successfully",
        "filename": video.filename,
        "total_frames": total_frames,
        "pose_detected_frames": detected_frames,
        "sample_landmarks": landmarks[:1]
    }