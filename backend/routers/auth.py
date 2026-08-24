from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel, field_validator

from database.database import get_db
from database import crud, schemas, models
from services.auth_service import create_access_token, get_current_user
from services import email_service, google_auth_service

router = APIRouter(tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class GoogleSignInRequest(BaseModel):
    credential: str  # the ID token from Google Identity Services


class GoogleCompleteSignupRequest(BaseModel):
    credential: str
    role: str
    # NEW. Google doesn't provide a username, so the frontend's "choose
    # your role" step (GoogleAuthButton.jsx) now also collects this before
    # calling this endpoint. Same format rule as manual registration -
    # reuses schemas._validate_username_format so both paths enforce the
    # exact same rule from a single source of truth.
    username: str

    @field_validator("username")
    @classmethod
    def username_format(cls, v):
        return schemas._validate_username_format(v)


def _auto_create_athlete_profile_if_needed(db: Session, user: models.User):
    """
    Shared by /register and /auth/google/complete-signup: an Athlete only
    ever has ONE profile - their own - so there's no reason to make them
    fill out a separate "create profile" form with a free-typed
    athlete_id afterward. Sport-specific fields start blank; the
    Dashboard's Edit Profile flow lets them fill those in whenever ready.
    """
    if user.role != "Athlete":
        return
    auto_athlete_id = f"ATH{user.id:04d}"
    athlete_profile = schemas.AthleteCreate(
        athlete_id=auto_athlete_id,
        sport_type="",
        position="",
        age="",
        height="",
        weight="",
        injury_history="",
        training_load="",
    )
    crud.create_athlete(db, athlete_profile, user_id=user.id)


@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user. Same request body/behavior as before, PLUS
    (NEW) a required, unique username - validated for format at the
    Pydantic layer (schemas.UserCreate), then checked for uniqueness here
    against the database before anything is created, so the frontend gets
    a clean, specific error instead of a generic 500/IntegrityError.
    """
    existing_email = crud.get_user_by_email(db, user.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # NEW. Checked explicitly (not just relying on the DB's UNIQUE
    # constraint + IntegrityError) so the error message is exactly what
    # the spec asks for, not a generic database error.
    if crud.username_exists(db, user.username):
        raise HTTPException(
            status_code=400,
            detail="Username already exists. Please choose another username.",
        )

    hashed_password = pwd_context.hash(user.password)
    try:
        created = crud.create_user(
            db,
            name=user.name,
            email=user.email,
            hashed_password=hashed_password,
            role=user.role,
            username=user.username,
        )
    except IntegrityError:
        # Race condition: someone registered this exact email/username in
        # the gap between our checks above and our insert.
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered. Please try again.",
        )

    _auto_create_athlete_profile_if_needed(db, created)

    return {"message": f"User {created.name} registered successfully"}


@router.post("/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Same response shape as before (message + user{email,name,role} + NEW
    username) plus access_token. The frontend MUST store access_token and
    send it as `Authorization: Bearer <access_token>` on every request to
    an ownership-aware endpoint.
    """
    user = crud.get_user_by_email(db, credentials.email)
    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Revoked accounts are checked AFTER password verification, same as a
    # normal failed login would be - this avoids leaking "this email is
    # registered but revoked" to someone who doesn't know the password.
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been revoked. Please contact the administrator.",
        )

    access_token = create_access_token(user.id)

    return {
        "message": "Login successful",
        "user": {
            "email": user.email,
            "name": user.name,
            "username": user.username,
            "role": user.role,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Sends a real password reset email if the address is registered.

    SECURITY NOTE: always returns the same generic success message whether
    or not the email exists - this prevents someone from using this
    endpoint to check which emails are registered in the system.
    """
    user = crud.get_user_by_email(db, body.email)

    if user:
        reset_token = crud.create_password_reset_token(db, user.id)
        try:
            email_service.send_password_reset_email(user.email, reset_token.token)
        except Exception:
            import logging
            logging.getLogger("uvicorn.error").exception("Failed to send password reset email")

    return {
        "message": "If that email is registered, a password reset link has been sent to it."
    }


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Completes a password reset using the token from the emailed link."""
    reset_token = crud.get_valid_reset_token(db, body.token)
    if not reset_token:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    user = db.query(models.User).filter(models.User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    hashed_password = pwd_context.hash(body.new_password)
    crud.update_user_password(db, user, hashed_password)
    crud.mark_reset_token_used(db, reset_token)

    return {"message": "Your password has been reset successfully. You can now log in."}


@router.post("/auth/google")
def google_sign_in(body: GoogleSignInRequest, db: Session = Depends(get_db)):
    """
    Called every time someone clicks "Sign in with Google" - verifies the
    credential server-side, then:
      - If a user with this email already exists: logs them straight in.
      - If not: does NOT create the account yet - returns is_new_user=true
        so the frontend can show a "choose your role + username" step,
        then call /auth/google/complete-signup with the SAME credential.
    """
    payload = google_auth_service.verify_google_token(body.credential)
    email = payload["email"]
    name = payload.get("name", email.split("@")[0])

    user = crud.get_user_by_email(db, email)

    if not user:
        return {
            "is_new_user": True,
            "email": email,
            "name": name,
        }

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been revoked. Please contact the administrator.",
        )

    access_token = create_access_token(user.id)
    return {
        "is_new_user": False,
        "message": "Login successful",
        "user": {
            "email": user.email,
            "name": user.name,
            "username": user.username,
            "role": user.role,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/auth/google/complete-signup")
def google_complete_signup(body: GoogleCompleteSignupRequest, db: Session = Depends(get_db)):
    """
    Finishes creating an account for a first-time Google sign-in, now that
    the frontend has collected a role AND (NEW) a username. Re-verifies
    the credential (email/name are never taken from the first call's
    response - always re-derived from the token itself) so this can't be
    spoofed by someone posting an arbitrary email/role/username triple.
    """
    payload = google_auth_service.verify_google_token(body.credential)
    email = payload["email"]
    name = payload.get("name", email.split("@")[0])

    if body.role not in schemas.SELF_REGISTERABLE_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Role must be one of: {', '.join(sorted(schemas.SELF_REGISTERABLE_ROLES))}",
        )

    existing = crud.get_user_by_email(db, email)
    if existing:
        # They already completed signup (e.g. double-submitted) - just log
        # them in instead of erroring.
        if not existing.is_active:
            raise HTTPException(
                status_code=403,
                detail="Your account has been revoked. Please contact the administrator.",
            )
        access_token = create_access_token(existing.id)
        return {
            "message": "Login successful",
            "user": {
                "email": existing.email,
                "name": existing.name,
                "username": existing.username,
                "role": existing.role,
            },
            "access_token": access_token,
            "token_type": "bearer",
        }

    # NEW. Same clear-error-before-insert pattern as /register.
    if crud.username_exists(db, body.username):
        raise HTTPException(
            status_code=400,
            detail="Username already exists. Please choose another username.",
        )

    # Google-authenticated users don't set a password at signup - generate
    # a random one they'll never need, so hashed_password (NOT NULL) is
    # still satisfied. They can set a real one anytime via Forgot Password.
    import secrets
    random_password = secrets.token_urlsafe(32)
    hashed_password = pwd_context.hash(random_password)

    try:
        created = crud.create_user(
            db,
            name=name,
            email=email,
            hashed_password=hashed_password,
            role=body.role,
            username=body.username,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered. Please try again.",
        )

    _auto_create_athlete_profile_if_needed(db, created)

    access_token = create_access_token(created.id)
    return {
        "message": f"Account created for {created.name} via Google Sign-In.",
        "user": {
            "email": created.email,
            "name": created.name,
            "username": created.username,
            "role": created.role,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }


# ---------------------------------------------------------
# NEW. Current-user profile + username self-service.
# ---------------------------------------------------------
@router.get("/users/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    """Lets the frontend check whether the logged-in account has a
    username yet (accounts created before this feature, or via Google
    signup flows that predate this change, may have username=None) -
    used to decide whether to show the 'set your username' prompt."""
    return current_user


@router.patch("/users/me/username", response_model=schemas.UserResponse)
def set_my_username(
    body: schemas.UsernameSetRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    One-time (or whenever-ready) username setup for accounts that don't
    have one yet - existing accounts from before this feature, or a
    Google signup that deferred it. Works for ANY role, not just Athlete -
    a Coach/Physio/Sports Scientist needs a username too, since Request
    Access searches by the TARGET's username, and any role can be a
    target.
    """
    if current_user.username:
        raise HTTPException(
            status_code=400,
            detail="You already have a username set. Contact an administrator to change it.",
        )

    if crud.username_exists(db, body.username):
        raise HTTPException(
            status_code=400,
            detail="Username already exists. Please choose another username.",
        )

    try:
        updated = crud.set_username(db, current_user, body.username)
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Username already exists. Please choose another username.",
        )

    return updated