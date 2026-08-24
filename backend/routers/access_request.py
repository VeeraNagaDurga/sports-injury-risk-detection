from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from database import crud, models
from services.auth_service import get_current_user
from services import notification_service

router = APIRouter(tags=["Access Requests"])


# CHANGED. Request Access now searches by the target's unique username
# instead of requiring their Athlete ID (Athlete ID stays exactly where
# it already is - on the athlete profile itself; this is only how a
# request gets CREATED, nothing else about it changed).
class AccessRequestCreate(BaseModel):
    username: str


class ApproveRequestBody(BaseModel):
    can_upload: bool = False


def _serialize_request(req: models.AthleteAccessRequest, db: Session):
    requester = db.query(models.User).filter(models.User.id == req.requested_by_user_id).first()
    athlete = req.athlete
    return {
        "id": req.id,
        "athlete_id": athlete.athlete_id if athlete else None,
        "requested_by_email": requester.email if requester else None,
        "requested_by_name": requester.name if requester else None,
        "requested_by_role": requester.role if requester else None,
        "status": req.status,
        "can_upload": req.can_upload,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "approved_at": req.approved_at.isoformat() if req.approved_at else None,
        "revoked_at": req.revoked_at.isoformat() if req.revoked_at else None,
    }


@router.post("/access-requests")
def create_access_request(
    body: AccessRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    A coach/physio/sports scientist/administrator requests access to a
    specific athlete's data, found by the target's unique USERNAME.
    Athletes cannot send access requests themselves - this feature is
    one-directional by design (an athlete's only role here is to
    approve/deny/revoke requests aimed at them).

    Username alone never grants access - this only creates a pending
    request; the target athlete must still explicitly approve it (see
    approve_request below) before anything is visible.
    """
    if current_user.role == "Athlete":
        raise HTTPException(
            status_code=403,
            detail="Athlete accounts cannot send access requests - only approve or revoke them.",
        )

    target_user = crud.get_user_by_username(db, body.username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot request access to yourself.")

    athlete = db.query(models.Athlete).filter(models.Athlete.user_id == target_user.id).first()
    if not athlete:
        raise HTTPException(
            status_code=404,
            detail="This user does not have an athlete profile to request access to.",
        )

    existing = crud.get_pending_or_active_request(db, athlete.id, current_user.id)
    if existing:
        # CHANGED. Spec calls for two distinct messages depending on
        # whether it's still pending vs already approved, instead of one
        # generic "already {status}" message.
        if existing.status == "approved":
            raise HTTPException(status_code=400, detail="Access already granted.")
        raise HTTPException(status_code=400, detail="Access request already exists.")

    request = crud.create_access_request(
        db, athlete_pk_id=athlete.id, requested_by_user_id=current_user.id
    )

    # NEW. Lets the target athlete know a request is waiting on them,
    # both in-app (bell icon) and by email - same delivery pattern used
    # for analysis alerts.
    notification_service.notify_access_request(
        db,
        recipient=target_user,
        type="access_request_received",
        title="New access request",
        message=f"{current_user.name} ({current_user.role}) has requested access to your athlete data.",
        athlete_id=athlete.athlete_id,
    )

    return {
        "message": f"Access request sent to @{body.username} (Athlete ID: {athlete.athlete_id}). Waiting for their approval.",
        "request": _serialize_request(request, db),
    }


@router.get("/access-requests/incoming")
def list_incoming_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Requests targeting athletes the CURRENT user owns - this is the
    athlete's own view: who's asking for access, and who currently has it
    (so they can revoke).
    """
    requests = crud.get_incoming_requests_for_user(db, current_user.id)
    return {"requests": [_serialize_request(r, db) for r in requests]}


@router.get("/access-requests/outgoing")
def list_outgoing_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Requests the CURRENT user has sent (as a coach/physio/etc) - lets
    them track status without needing to ask the athlete directly."""
    requests = crud.get_outgoing_requests_for_user(db, current_user.id)
    return {"requests": [_serialize_request(r, db) for r in requests]}


def _get_owned_request_or_403(db: Session, request_id: int, current_user: models.User):
    request = crud.get_access_request(db, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Access request not found")
    if not request.athlete or request.athlete.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This access request does not concern an athlete you own")
    return request


@router.post("/access-requests/{request_id}/approve")
def approve_request(
    request_id: int,
    body: ApproveRequestBody = ApproveRequestBody(),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Only the athlete who owns the target profile can approve a request
    aimed at them. can_upload defaults to False (view-only) - the athlete
    can explicitly grant upload permission on top of view access."""
    request = _get_owned_request_or_403(db, request_id, current_user)

    if request.status != "pending":
        raise HTTPException(status_code=400, detail=f"This request is already {request.status}, not pending")

    updated = crud.approve_access_request(db, request, can_upload=body.can_upload)

    requester = crud.get_user_by_id(db, request.requested_by_user_id)
    if requester:
        upload_note = " (including upload access)" if body.can_upload else ""
        notification_service.notify_access_request(
            db,
            recipient=requester,
            type="access_request_approved",
            title="Access request approved",
            message=f"{current_user.name} approved your access request{upload_note}.",
            athlete_id=request.athlete.athlete_id if request.athlete else None,
        )

    return {"message": "Access request approved.", "request": _serialize_request(updated, db)}


@router.post("/access-requests/{request_id}/deny")
def deny_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    request = _get_owned_request_or_403(db, request_id, current_user)

    if request.status != "pending":
        raise HTTPException(status_code=400, detail=f"This request is already {request.status}, not pending")

    updated = crud.deny_access_request(db, request)

    requester = crud.get_user_by_id(db, request.requested_by_user_id)
    if requester:
        notification_service.notify_access_request(
            db,
            recipient=requester,
            type="access_request_denied",
            title="Access request denied",
            message=f"{current_user.name} denied your access request.",
            athlete_id=request.athlete.athlete_id if request.athlete else None,
        )

    return {"message": "Access request denied.", "request": _serialize_request(updated, db)}


@router.post("/access-requests/{request_id}/revoke")
def revoke_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Revokes a PREVIOUSLY APPROVED access grant. Since every read-access
    check queries current status live (never a cached/copied permission),
    this takes effect immediately - the coach loses access to everything,
    past and future, the instant this commits.
    """
    request = _get_owned_request_or_403(db, request_id, current_user)

    if request.status != "approved":
        raise HTTPException(status_code=400, detail="Only an approved request can be revoked")

    updated = crud.revoke_access_request(db, request)

    requester = crud.get_user_by_id(db, request.requested_by_user_id)
    if requester:
        notification_service.notify_access_request(
            db,
            recipient=requester,
            type="access_revoked",
            title="Access revoked",
            message=f"{current_user.name} revoked your access to their athlete data.",
            athlete_id=request.athlete.athlete_id if request.athlete else None,
        )

    return {"message": "Access has been revoked.", "request": _serialize_request(updated, db)}