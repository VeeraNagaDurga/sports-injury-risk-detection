"""
Athlete Intelligence Dashboard - trend data.
 
Distinct from anomaly_detection_service.py: that module compares ONE new
session against a rolling baseline to flag deviations. This module builds
the full session-by-session HISTORY for an athlete - risk score and
movement quality over time - so a coach/physio can see whether an athlete
is trending better or worse across every video that's ever been analyzed
for them, not just the most recent one.
"""
import json
 
 
def _safe_load(raw):
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return {}
 
 
def build_athlete_trend(analyses):
    """
    analyses: list of AnalysisResult ORM rows for one athlete, OLDEST FIRST
    (as returned by crud.get_all_completed_analyses_for_athlete).
    """
    sessions = []
    for a in analyses:
        risk = _safe_load(a.overall_risk_score)
        quality = _safe_load(a.movement_quality)
        sessions.append({
            "analysis_id": str(a.id),
            "date": a.created_at.isoformat() if a.created_at else None,
            "filename": a.video.original_filename if a.video else None,
            "overall_score": risk.get("overall_score"),
            "risk_level": risk.get("risk_level"),
            "movement_score": quality.get("movement_score"),
            "grade": quality.get("grade"),
        })
 
    if len(sessions) < 2:
        return {
            "session_count": len(sessions),
            "sessions": sessions,
            "trend": {
                "status": "insufficient_data",
                "message": "Need at least 2 completed sessions to show a trend for this athlete.",
            },
        }
 
    first_score = sessions[0]["overall_score"]
    latest_score = sessions[-1]["overall_score"]
 
    if first_score is None or latest_score is None:
        trend = {
            "status": "insufficient_data",
            "message": "Missing risk score data in some sessions.",
        }
    else:
        change = round(latest_score - first_score, 1)
        # Risk score going DOWN is improvement (less injury risk), going UP
        # is decline - the sign is inverted relative to most "trend up =
        # good" dashboards, worth being explicit about in the UI.
        if change <= -5:
            direction = "Improving"
        elif change >= 5:
            direction = "Declining"
        else:
            direction = "Stable"
 
        trend = {
            "status": "ok",
            "first_score": first_score,
            "latest_score": latest_score,
            "change": change,
            "direction": direction,
        }
 
    return {
        "session_count": len(sessions),
        "sessions": sessions,
        "trend": trend,
    }
 