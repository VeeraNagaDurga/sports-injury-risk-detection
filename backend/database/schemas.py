from datetime import datetime
import re

from pydantic import BaseModel, field_validator

# Roles a user can self-register as. "Administrator" is deliberately
# excluded - there is exactly ONE admin account, created only via the
# seed script (see seed_admin.py), never through public registration.
SELF_REGISTERABLE_ROLES = {"Athlete", "Coach", "Physiotherapist", "Sports Scientist"}

# All valid roles in the system, including Administrator - used wherever
# a role needs validating but self-registration isn't the context (e.g.
# an admin manually adjusting a user's role later).
ALL_ROLES = SELF_REGISTERABLE_ROLES | {"Administrator"}

# NEW. Username format: 3-20 chars, must start with a letter, letters/
# digits/underscore only. Enforced here (schema level, runs before the
# request even reaches a router) AND re-checked for uniqueness in
# routers/auth.py against the database - format and uniqueness are two
# separate concerns, both required.
USERNAME_PATTERN = re.compile(r"^[a-zA-Z][a-zA-Z0-9_]{2,19}$")


def _validate_username_format(v: str) -> str:
    if not USERNAME_PATTERN.match(v):
        raise ValueError(
            "Username must be 3-20 characters, start with a letter, and contain "
            "only letters, numbers, and underscores."
        )
    return v


# ---------------------------------------------------------
# User
# ---------------------------------------------------------
class UserCreate(BaseModel):
    name: str | None = None
    # NEW. Required for every new registration (manual or Google) - see
    # routers/auth.py for exactly where each flow collects this.
    username: str
    email: str
    password: str
    role: str = "Athlete"

    @field_validator("role")
    @classmethod
    def role_must_be_self_registerable(cls, v):
        if v not in SELF_REGISTERABLE_ROLES:
            raise ValueError(
                f"Role must be one of: {', '.join(sorted(SELF_REGISTERABLE_ROLES))}. "
                f"Administrator accounts cannot be created through registration."
            )
        return v

    @field_validator("username")
    @classmethod
    def username_format(cls, v):
        return _validate_username_format(v)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    email: str
    name: str | None = None
    username: str | None = None
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    """
    Returned by POST /login. The frontend must store access_token and
    send it as `Authorization: Bearer <access_token>` on every subsequent
    request that needs to know who the logged-in user is.
    """
    access_token: str
    token_type: str = "bearer"


# NEW. Used by PATCH /users/me/username - the one-time (or whenever-ready)
# flow for accounts that existed before username was added, or Google
# signups that deferred picking one.
class UsernameSetRequest(BaseModel):
    username: str

    @field_validator("username")
    @classmethod
    def username_format(cls, v):
        return _validate_username_format(v)


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


# ---------------------------------------------------------
# Admin
# Backs the Admin Dashboard's Users list, the per-user detail view,
# and the Revoke Account response. Deliberately separate from
# UserResponse/AnalysisResultResponse above (which are what a normal user
# sees about themselves) - the admin views need id/is_active/created_at
# and a compact analysis summary that those do not expose.
# ---------------------------------------------------------
from datetime import datetime as _datetime


class AdminUserSummary(BaseModel):
    id: int
    name: str | None = None
    username: str | None = None
    email: str
    role: str
    is_active: bool
    created_at: _datetime

    class Config:
        from_attributes = True


class AdminAnalysisSummary(BaseModel):
    id: int
    status: str | None = None
    risk_level: str | None = None
    overall_risk_score_numeric: float | None = None
    created_at: _datetime | None = None

    class Config:
        from_attributes = True


class AdminUserDetail(BaseModel):
    id: int
    name: str | None = None
    username: str | None = None
    email: str
    role: str
    is_active: bool
    created_at: _datetime
    athletes: list[AthleteResponse]
    analyses: list[AdminAnalysisSummary]

    class Config:
        from_attributes = True


class RevokeUserResponse(BaseModel):
    message: str
    user: AdminUserSummary

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    analysis_id: int | None = None
    is_read: bool
    created_at: _datetime

    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    unread_count: int


class SupportMessageCreate(BaseModel):
    subject: str
    message: str
    category: str


class SupportMessageResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    message: str
    category: str
    status: str
    admin_reply: str | None = None
    replied_at: _datetime | None = None
    created_at: _datetime
    sender_username: str | None = None
    sender_name: str | None = None

    class Config:
        from_attributes = True


class SupportReplyRequest(BaseModel):
    reply: str