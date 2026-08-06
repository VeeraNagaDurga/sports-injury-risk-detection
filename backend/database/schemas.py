from pydantic import BaseModel
 
 
# ---------------------------------------------------------
# User
# ---------------------------------------------------------
class UserCreate(BaseModel):
    name: str | None = None
    email: str
    password: str
    role: str = "Athlete"
 
 
class UserLogin(BaseModel):
    email: str
    password: str
 
 
class UserResponse(BaseModel):
    email: str
    name: str | None = None
    role: str
 
    class Config:
        from_attributes = True
 
 
class Token(BaseModel):
    """
    NEW. Returned by POST /login. The frontend must store access_token and
    send it as `Authorization: Bearer <access_token>` on every subsequent
    request that needs to know who the logged-in user is.
    """
    access_token: str
    token_type: str = "bearer"
 
 
# ---------------------------------------------------------
# Athlete
# ---------------------------------------------------------
class AthleteBase(BaseModel):
    # NOTE: deliberately no user_id field here. Ownership is never accepted
    # from the client - it's always taken from the authenticated user's
    # token server-side (see routers/athlete.py). This is what prevents a
    # malicious or buggy frontend from creating/claiming athletes on behalf
    # of another user_id.
    athlete_id: str
    sport_type: str
    position: str = ""
    age: str = ""
    height: str = ""
    weight: str = ""
    injury_history: str = ""
    training_load: str = ""
 
 
class AthleteCreate(AthleteBase):
    pass
 
 
class AthleteUpdate(AthleteBase):
    pass
 
 
class AthleteResponse(AthleteBase):
    id: int
    user_id: int
 
    class Config:
        from_attributes = True
 
 
# ---------------------------------------------------------
# Video
# ---------------------------------------------------------
class VideoResponse(BaseModel):
    id: int
    athlete_pk_id: int
    original_filename: str
    stored_filename: str
    processed_filename: str
 
    class Config:
        from_attributes = True
 
 
# ---------------------------------------------------------
# Analysis Result
# ---------------------------------------------------------
class AnalysisResultResponse(BaseModel):
    id: int
    athlete_pk_id: int
    video_id: int
    overall_risk_score: str
    movement_quality: str
    injury_risks: str
    recommendations: str
 
    class Config:
        from_attributes = True
 
 
# ---------------------------------------------------------
# Report
# ---------------------------------------------------------
class ReportResponse(BaseModel):
    id: int
    analysis_id: int
    report_name: str
    report_path: str
    report_url: str
    processed_video: str
    processed_video_url: str
 
    class Config:
        from_attributes = True
 