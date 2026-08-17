from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.database import get_db
from database import crud, models
from services import analysis_service, report_service, export_service
from services.auth_service import get_current_user

router = APIRouter(tags=["Analysis"])


@router.get("/analysis/{analysis_id}")
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Same endpoint path and response shape as before. Now scoped to the
    logged-in user: only returns this analysis if it belongs to one of
    their athletes.
    """
    try:
        analysis_pk = int(analysis_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = crud.get_analysis_viewable(db, analysis_pk, current_user.id)
    if analysis:
        return analysis_service.build_analysis_response(analysis, db=db)

    if crud.analysis_exists(db, analysis_pk):
        raise HTTPException(status_code=403, detail="This analysis does not belong to you")
    raise HTTPException(status_code=404, detail="Analysis not found")


# ---------------------------------------------------------
# NEW. Excel export - spec section 12. Reuses the exact same
# authorization rule (owned OR shared-with-me) and the exact same data
# (build_analysis_response) as the JSON GET endpoint above, so the Excel
# file can never contain anything the user couldn't already see on the
# Results page.
# ---------------------------------------------------------
@router.get("/analysis/{analysis_id}/export/excel")
def export_analysis_excel(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        analysis_pk = int(analysis_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = crud.get_analysis_viewable(db, analysis_pk, current_user.id)
    if not analysis:
        if crud.analysis_exists(db, analysis_pk):
            raise HTTPException(status_code=403, detail="This analysis does not belong to you")
        raise HTTPException(status_code=404, detail="Analysis not found")

    if analysis.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="This analysis hasn't finished processing yet - Excel export isn't available until it completes.",
        )

    analysis_data = analysis_service.build_analysis_response(analysis, db=db)
    excel_buffer = export_service.build_excel_report(analysis_data)

    athlete_id = analysis_data.get("athlete_id") or "athlete"
    filename = f"analysis_{analysis_id}_{athlete_id}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------
# Analysis CRUD (Read + Delete) - scoped to the logged-in user
# ---------------------------------------------------------
@router.get("/analyses")
def list_analyses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analyses = crud.get_all_analysis_for_user(db, current_user.id)
    return {
        "count": len(analyses),
        "analyses": [analysis_service.build_analysis_response(a) for a in analyses],
    }


@router.delete("/analysis/{analysis_id}")
def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Deletes an analysis result's DB row (cascading to its reports) and
    the physical PDF report file - only if it belongs to the current user."""
    try:
        analysis_pk = int(analysis_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = crud.get_analysis_for_user(db, analysis_pk, current_user.id)
    if not analysis:
        if crud.analysis_exists(db, analysis_pk):
            raise HTTPException(status_code=403, detail="This analysis does not belong to you")
        raise HTTPException(status_code=404, detail="Analysis not found")

    for report in analysis.reports:
        report_service.delete_report_files(report)

    crud.delete_analysis(db, analysis_pk)

    return {"message": f"Analysis {analysis_id} and its report were deleted successfully"}