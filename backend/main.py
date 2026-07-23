import os
import re
import shutil
import uuid
from pathlib import Path
from urllib.parse import unquote, quote
 
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
 
from utils.skeleton_tracking import process_video_with_skeleton
from utils.biomechanics import analyze_sequence_biomechanics
from utils.movement_quality import generate_quality_report
from utils.report_generator import generate_biomechanics_report
from utils.injury_risk_engine import (
    predict_injury_risks,
    calculate_weighted_risk_score,
    generate_corrective_recommendations,
)
 
app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# ---------------------------------------------------------
# Directories
# ---------------------------------------------------------
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
 
PROCESSED_DIR = Path(__file__).parent.parent / "processed_videos"
PROCESSED_DIR.mkdir(exist_ok=True)
 
REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
 
BASE_URL = "http://127.0.0.1:8000"
 
analysis_db = {}
users_db = {}
athlete_db = {}
 
 
# ---------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------
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
 
 
# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def sanitize_stem(name: str) -> str:
    """
    Strip a filename down to a safe stem: letters, digits, underscore, hyphen only.
    This is what actually prevents the whole class of bugs where spaces /
    parentheses / unicode characters in the ORIGINAL upload name (e.g.
    'WhatsApp Video 2024-01-01 at 10.30.45.mp4') end up mismatched between
    what gets saved to disk, what's stored in analysis_db, and what the
    frontend requests back.
    """
    stem = Path(name).stem
    stem = re.sub(r"[^A-Za-z0-9_-]+", "_", stem).strip("_")
    return stem[:50] or "video"
 
 
# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------
@app.get("/")
async def root():
    return {"message": "Sports Injury Risk Detection API"}
 
 
@app.post("/register")
async def register(user: User):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    users_db[user.email] = {
        "name": user.name,
        "email": user.email,
        "password": user.password,
        "role": user.role,
    }
    return {"message": f"User {user.name} registered successfully"}
 
 
@app.post("/login")
async def login(credentials: LoginRequest):
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
            "role": user["role"],
        },
    }
 
 
@app.post("/athlete-profile")
async def save_athlete_profile(profile: AthleteProfile):
    try:
        athlete_db[profile.athlete_id] = profile.dict()
        return {
            "message": f"Athlete profile for {profile.athlete_id} saved successfully",
            "profile": athlete_db[profile.athlete_id],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@app.get("/athlete-profile/{athlete_id}")
async def get_athlete_profile(athlete_id: str):
    if athlete_id not in athlete_db:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return {"profile": athlete_db[athlete_id]}
 
 
@app.get("/athlete-profiles")
async def get_all_athlete_profiles():
    return {"count": len(athlete_db), "profiles": list(athlete_db.values())}
 
 
@app.post("/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    athlete_name: str = Form("Athlete"),
    athlete_id: str = Form(None),
):
    """
    Upload a sports video and run the full injury-risk analysis pipeline:
    pose/skeleton tracking -> biomechanics -> injury risk prediction ->
    weighted risk scoring -> corrective recommendations -> PDF report.
    """
    try:
        # --- Build a SAFE, UNIQUE filename right here, once. Every filename
        # used downstream (uploads, processed_videos, analysis_db, the URLs
        # sent to the frontend) is derived from this single source of truth. ---
        original_ext = Path(video.filename).suffix.lower() or ".mp4"
        unique_id = uuid.uuid4().hex[:10]
        safe_stem = sanitize_stem(video.filename)
        stored_filename = f"{unique_id}_{safe_stem}{original_ext}"
 
        file_path = UPLOAD_DIR / stored_filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
 
        tracking_result = process_video_with_skeleton(
            str(file_path),
            output_folder=str(PROCESSED_DIR),
        )
 
        # Use the full per-frame joint sequence, not just the last detected
        # frame - analyze_biomechanics() only looks at one frame and its
        # range_of_motion has no avg/min/max/rom, which is why those columns
        # were rendering blank. analyze_sequence_biomechanics() also adds
        # valgus_details/peak_metrics, which injury_risk_engine.py needs.
        biomechanics = analyze_sequence_biomechanics(tracking_result["all_joints"])
        quality = generate_quality_report(biomechanics)
 
        # --- Injury risk prediction engine ---
        # athlete_profile drives the "Historical Injury Factors" and
        # "Training Load Indicators" portions of the score, and the
        # injury-history-aware reasons in each category. Without a
        # matched profile, these still work (scores are just based
        # purely on the biomechanics of this session).
        athlete_profile = athlete_db.get(athlete_id) if athlete_id else None
 
        injury_risks = predict_injury_risks(biomechanics, athlete_profile)
        risk_score_summary = calculate_weighted_risk_score(biomechanics, athlete_profile)
        recommendations = generate_corrective_recommendations(injury_risks)
 
        report_path = generate_biomechanics_report(
            athlete_name=athlete_name,
            filename=video.filename,
            total_frames=tracking_result["total_frames"],
            detected_frames=tracking_result["detected_frames"],
            metrics=biomechanics["joint_angles"],
            movement_quality=quality,
            output_folder=str(REPORTS_DIR),
            athlete_profile=athlete_profile,
            injury_risks=injury_risks,
            risk_score_summary=risk_score_summary,
        )
 
        processed_video_name = Path(tracking_result["processed_video"]).name
        report_name = Path(report_path).name
 
        # Sanity check BEFORE we ever tell the frontend about these URLs.
        if not (PROCESSED_DIR / processed_video_name).exists():
            raise HTTPException(
                status_code=500,
                detail=f"Processed video was not saved correctly: {processed_video_name}",
            )
        if not (REPORTS_DIR / report_name).exists():
            raise HTTPException(
                status_code=500,
                detail=f"Report was not saved correctly: {report_name}",
            )
 
        processed_video_url = f"{BASE_URL}/processed-videos/{quote(processed_video_name, safe='')}"
        report_url = f"{BASE_URL}/reports/{quote(report_name, safe='')}"
 
        analysis_id = unique_id
 
        analysis_db[analysis_id] = {
            "analysis_id": analysis_id,
            "filename": video.filename,
            "athlete_name": athlete_name,
            "athlete_id": athlete_id,
            "athlete_profile": athlete_profile,
            "tracking": tracking_result,
            "biomechanics": biomechanics,
            "movement_quality": quality,
            "injury_risks": injury_risks,
            "risk_score_summary": risk_score_summary,
            "recommendations": recommendations,
            "report_path": report_name,
            "report_download": report_url,
            "processed_video": processed_video_name,
            "processed_video_download": processed_video_url,
        }
 
        return analysis_db[analysis_id]
 
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@app.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    if analysis_id not in analysis_db:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis_db[analysis_id]
 
 
@app.get("/reports/{filename}")
async def download_report(filename: str):
    """Download a generated PDF biomechanics report"""
    decoded_filename = unquote(filename)
    file_path = REPORTS_DIR / decoded_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(file_path, media_type="application/pdf", filename=decoded_filename)
 
 
@app.get("/processed-videos/{filename}")
async def download_processed_video(filename: str):
    """Download / stream the processed video with skeleton overlay"""
    decoded_filename = unquote(filename)
    file_path = PROCESSED_DIR / decoded_filename
 
    if not file_path.exists():
        available = os.listdir(PROCESSED_DIR)
        raise HTTPException(
            status_code=404,
            detail=(
                f"Processed video not found: '{decoded_filename}'. "
                f"Files currently in processed_videos: {available}"
            ),
        )
 
    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=decoded_filename,
    )
 
 
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
 
 
if __name__ == "__main__":
    import uvicorn
 
    uvicorn.run(app, host="127.0.0.1", port=8000)