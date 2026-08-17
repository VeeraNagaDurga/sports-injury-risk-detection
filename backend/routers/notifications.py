from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from database import crud, models, schemas
from services.auth_service import get_current_user

router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=list[schemas.NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """The logged-in user's own notifications, newest first. Any role can
    call this - it's always scoped to current_user.id, never a param."""
    return crud.get_notifications_for_user(db, current_user.id)


@router.get("/notifications/unread-count", response_model=schemas.UnreadCountResponse)
def unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Powers the badge number on the bell icon - polled lightly by the
    frontend rather than fetching the full list every time."""
    count = crud.get_unread_notification_count(db, current_user.id)
    return {"unread_count": count}


@router.post("/notifications/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notification = crud.get_notification_by_id(db, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    # Ownership check - a user must never be able to mark (or even confirm
    # the existence of) another user's notification by guessing an id.
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    return crud.mark_notification_read(db, notification)


@router.post("/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    crud.mark_all_notifications_read(db, current_user.id)
    return {"message": "All notifications marked as read."}