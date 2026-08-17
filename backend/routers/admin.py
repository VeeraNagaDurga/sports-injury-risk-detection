from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from database import crud, models, schemas
from services import dashboard_service
from services.auth_service import require_admin

router = APIRouter(tags=["Admin"])


@router.get("/admin/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """
    Full Admin Analytics Dashboard payload - KPI cards, user/sports/risk
    distributions, injury type breakdown, monthly trends, highest-risk
    sports table, and recent platform activity. Protected to the
    Administrator role only - anyone else gets a 403 (require_admin
    returns 401 first if not logged in at all, 403 if logged in as a
    non-admin - see services/auth_service.py).
    """
    return dashboard_service.build_admin_dashboard(db)


# ---------------------------------------------------------
# NEW. Admin user management: list users, inspect one user's existing
# data, and revoke/disable an account. All three are protected by the
# same require_admin dependency as the dashboard above - a non-admin
# token gets a 403 from FastAPI's dependency system itself, never reaches
# the route body, so there's no way to bypass this by hiding/showing a
# button in the frontend.
# ---------------------------------------------------------
@router.get("/admin/users", response_model=list[schemas.AdminUserSummary])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """Every registered user, real data straight from Postgres - backs the
    Admin Dashboard's Users table."""
    return crud.get_all_users(db)


@router.get("/admin/users/{user_id}", response_model=schemas.AdminUserDetail)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """One user's profile plus their own existing athlete profiles and
    analysis history - powers the 'select a user' detail view. Uses
    STRICT ownership (crud.get_all_athletes_for_user /
    get_all_analyses_owned_by_user) so the Admin sees what this user
    actually created, not data merely shared with them by someone else."""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    athletes = crud.get_all_athletes_for_user(db, user_id)
    analyses = crud.get_all_analyses_owned_by_user(db, user_id)

    return schemas.AdminUserDetail(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        athletes=athletes,
        analyses=analyses,
    )


@router.post("/admin/users/{user_id}/revoke", response_model=schemas.RevokeUserResponse)
def revoke_user_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """
    Disables a user's account (login + every authenticated request get
    blocked immediately - see services/auth_service.get_current_user and
    routers/auth.login). Their existing athlete profiles, videos,
    analyses, and reports are left completely untouched in the database -
    this is a status flip, not a delete.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot revoke your own admin account.",
        )

    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="This account is already revoked.")

    updated = crud.revoke_user_account(db, user)

    return schemas.RevokeUserResponse(
        message=f"{updated.name or updated.email}'s account has been revoked.",
        user=updated,
    )