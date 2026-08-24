import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from database import crud, models, schemas
from services.auth_service import get_current_user
from services import notification_service

router = APIRouter(tags=["Support"])
logger = logging.getLogger("uvicorn.error")


@router.post("/support/messages", response_model=schemas.SupportMessageResponse)
def submit_support_message(
    body: schemas.SupportMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Submits a support message to the administrator regarding issues or requests.
    Available categories: "Technical Issue", "Video Analysis Issue", "Account Issue", "Access Issue", "Other".
    """
    if body.category not in ["Technical Issue", "Video Analysis Issue", "Account Issue", "Access Issue", "Other"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid category. Must be one of: Technical Issue, Video Analysis Issue, Account Issue, Access Issue, Other",
        )

    msg = crud.create_support_message(
        db,
        user_id=current_user.id,
        subject=body.subject,
        message=body.message,
        category=body.category,
    )

    # NEW. Fans out to every active Admin (bell icon + email) - without
    # this, a new ticket was only ever visible by an admin manually
    # checking /admin. A failure here (e.g. no admins in the system, or
    # an email hiccup - see notify_access_request's own try/except
    # around its email send) must never fail the ticket submission
    # itself, so it's wrapped separately.
    try:
        for admin in crud.get_all_admins(db):
            notification_service.notify_access_request(
                db,
                recipient=admin,
                type="support_ticket_received",
                title="New support message",
                message=f"{current_user.name} ({body.category}) - \"{body.subject}\"",
            )
    except Exception:
        logger.exception(f"Failed to notify admins of new support ticket (msg id {msg.id})")

    # Map sender fields for the response
    response = schemas.SupportMessageResponse.model_validate(msg)
    response.sender_username = current_user.username
    response.sender_name = current_user.name
    return response


@router.get("/support/messages", response_model=list[schemas.SupportMessageResponse])
def get_user_support_messages(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns the logged-in user's own sent support messages.
    """
    messages = crud.get_support_messages_for_user(db, current_user.id)
    enriched = []
    for msg in messages:
        res = schemas.SupportMessageResponse.model_validate(msg)
        res.sender_username = current_user.username
        res.sender_name = current_user.name
        enriched.append(res)
    return enriched