from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    Float,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database.database import Base


class User(Base):
    """
    Passwords are hashed with passlib/bcrypt in routers/auth.py - never store
    plaintext passwords.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Athlete")

    # Backs the Admin "Revoke Account" feature. server_default ensures
    # every existing row (created before this column existed) is treated as
    # active, matching current real-world behavior - same pattern already
    # used for AnalysisResult.status further down this file.
    is_active = Column(Boolean, default=True, nullable=False, server_default="true")

    # NEW. Unique, user-friendly identifier used specifically for Request
    # Access searches - separate from Athlete.athlete_id, which remains the
    # athlete PROFILE's own identifier (an athlete's ID; this is the USER
    # ACCOUNT's handle - a Coach, Physio, or Sports Scientist has a
    # username too, even though they have no athlete_id at all).
    # Nullable at the DB level so existing rows (including the seeded
    # Administrator) aren't broken by this migration - enforced as
    # required for all NEW signups at the application layer (routers/
    # auth.py), with a PATCH /users/me/username endpoint for existing
    # accounts to set one whenever they're ready.
    username = Column(String, unique=True, nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # One user -> many athlete profiles. Deleting a user takes their
    # athletes (and everything under them) with it, same cascade pattern
    # used everywhere else in this schema.
    athletes = relationship(
        "Athlete",
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class Athlete(Base):
    __tablename__ = "athletes"

    # athlete_id is no longer globally unique. It's only unique
    # PER USER, via the composite constraint below - this is what lets
    # two different users each create an athlete with id "ATH001" without
    # colliding, while still preventing one user from creating "ATH001"
    # twice.
    __table_args__ = (
        UniqueConstraint("user_id", "athlete_id", name="uq_athlete_user_athlete_id"),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    athlete_id = Column(String, nullable=False, index=True)
    sport_type = Column(String)
    position = Column(String)

    age = Column(String)
    height = Column(String)
    weight = Column(String)

    injury_history = Column(String)
    training_load = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="athletes")

    access_requests = relationship(
        "AthleteAccessRequest",
        back_populates="athlete",
        cascade="all, delete-orphan",
    )

    invites = relationship(
        "Invite",
        back_populates="athlete",
        cascade="all, delete-orphan",
    )

    # Cascade: deleting an Athlete deletes all of its Videos (and, via the
    # Video relationship below, their AnalysisResults and Reports).
    videos = relationship(
        "Video",
        back_populates="athlete",
        cascade="all, delete-orphan",
    )


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)

    athlete_pk_id = Column(Integer, ForeignKey("athletes.id"), nullable=False, index=True)

    original_filename = Column(String)
    stored_filename = Column(String)
    processed_filename = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    athlete = relationship("Athlete", back_populates="videos")

    analysis_results = relationship(
        "AnalysisResult",
        back_populates="video",
        cascade="all, delete-orphan",
    )


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)

    athlete_pk_id = Column(Integer, ForeignKey("athletes.id"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))

    overall_risk_score = Column(String)
    movement_quality = Column(String)

    injury_risks = Column(Text)
    recommendations = Column(Text)

    # Denormalized copies of data already inside the JSON blobs above,
    # purely so the Admin Analytics Dashboard can run real SQL
    # AVG()/GROUP BY()/COUNT() queries instead of parsing JSON per-row.
    overall_risk_score_numeric = Column(Float, nullable=True, index=True)
    risk_level = Column(String, nullable=True, index=True)

    biomechanics = Column(Text)

    status = Column(String, default="processing", server_default="completed")
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="analysis_results")

    athlete = relationship("Athlete")

    reports = relationship(
        "Report",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    analysis_id = Column(Integer, ForeignKey("analysis_results.id"))

    report_name = Column(String)
    report_path = Column(String)
    report_url = Column(String)

    processed_video = Column(String)
    processed_video_url = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("AnalysisResult", back_populates="reports")


class AthleteAccessRequest(Base):
    """
    Supports the request/approve sharing flow: a coach/physio/sports
    scientist/administrator looks up a target user by USERNAME and
    REQUESTS access to that user's athlete profile. The athlete (the
    owner of that profile) sees the pending request and can approve,
    deny, or - later - revoke it.

    An "approved" row IS the access grant - there's no separate access
    table. Access = "does a row exist for this athlete, with
    status='approved', where requested_by_user_id == me?"
    """
    __tablename__ = "athlete_access_requests"

    id = Column(Integer, primary_key=True, index=True)

    athlete_pk_id = Column(Integer, ForeignKey("athletes.id"), nullable=False, index=True)

    # Who is asking for access (the coach/physio/etc).
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # "pending" -> "approved" | "denied" ; "approved" -> "revoked" (by the athlete, later)
    status = Column(String, default="pending", nullable=False)

    # View access is granted by "approved" alone. Upload access is a
    # SEPARATE, stricter permission the athlete can additionally grant -
    # defaults to False.
    can_upload = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    approved_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    athlete = relationship("Athlete", back_populates="access_requests")


class Invite(Base):
    """
    Supports the invite-LINK sharing flow: the athlete's owner generates a
    shareable link (POST /athlete-profile/{athlete_id}/invite); whoever
    opens it and accepts gets READ-ONLY access to that athlete's data -
    same end result as an approved AthleteAccessRequest, just reached the
    other direction (owner shares a link out, instead of someone else
    searching a username and asking).

    An "accepted" row IS the access grant, same pattern as
    AthleteAccessRequest's "approved" row - see
    crud._accessible_athlete_pk_subquery, which checks both tables.
    """
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)

    athlete_pk_id = Column(Integer, ForeignKey("athletes.id"), nullable=False, index=True)

    # Who generated this link (always the athlete's owner - enforced in
    # routers/invite.py, not here).
    invited_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Random, unguessable, unique - this token IS the access control for
    # this feature (anyone holding the link can accept it).
    token = Column(String, unique=True, nullable=False, index=True)

    # "pending" -> "accepted" ; "pending" -> "revoked" (by the owner, later)
    status = Column(String, default="pending", nullable=False)

    # Set only once accepted - whoever accepted becomes the one with
    # read-only access, not necessarily whoever the owner had in mind.
    accepted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)

    athlete = relationship("Athlete", back_populates="invites")


class Notification(Base):
    """
    Backs the Notification & Alert System. Created automatically when an
    analysis finishes, and also (NEW) when an access request is sent,
    approved, or denied. Delivered two ways: this DB row (in-app bell
    icon) plus an email. Deliberately generic (type + title + message) so
    new alert types never require a schema change.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    type = Column(String, nullable=False, index=True)

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    analysis_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, server_default="false")

    created_at = Column(DateTime, default=datetime.utcnow)


class PasswordResetToken(Base):
    """
    Single-use, expiring tokens for the Forgot Password flow. DB-backed
    (rather than a stateless JWT) so a token can be explicitly marked used -
    prevents replaying the same reset link twice, even within its validity
    window.
    """
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)

    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)