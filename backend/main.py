from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from utils.video_processing import (
    validate_video,
    detect_pose,
    process_video_with_skeleton
)

from utils.biomechanics import (
    analyze_biomechanics
)

from utils.movement_quality import (
    calculate_movement_quality
)

from utils.report_generator import (
    generate_biomechanics_report
)

app = FastAPI(
    title="Sports Injury Risk Detection API",
    version="2.0"
)

# ----------------------------------------------------
# CORS
# ----------------------------------------------------

app.add_middleware(
    CORSMiddleware,
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
# Home
# ----------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "Sports Injury Risk Detection API Running",
        "version": "Milestone 2"
    }


# ----------------------------------------------------
# Register
# ----------------------------------------------------

@app.post("/register")
def register(user: User):

    return {
        "message": "Registration Successful",
        "user": user
    }


# ----------------------------------------------------
# Login
# ----------------------------------------------------

@app.post("/login")
def login(user: LoginUser):

    return {
        "message": "Login Successful",
        "email": user.email
    }


# ----------------------------------------------------
# Athlete Profile
# ----------------------------------------------------

@app.post("/athlete-profile")
def athlete_profile(profile: AthleteProfile):

    return {
        "message": "Profile Saved",
        "profile": profile
    }