"""
Notification & Alert System - all 5 alert types from the spec, all fired
automatically right when a video analysis finishes (see the call in
services/analysis_service.process_video_analysis_background):

  1. "injury_risk_alert"      - the OVERALL risk score for this session
                                 came back High or Critical.
  2. "high_risk_movement"     - one specific injury category (ACL,
                                 Hamstring, Ankle, Shoulder, LowerBack,
                                 Overuse) came back High or Critical, even
                                 if the overall score didn't.
  3. "training_load_warning"  - the weighted risk score's "training load"
                                 component (breakdown.training_load, based
                                 on the athlete's stated training load
                                 profile) is 60+.
  4. "recovery_reminder"      - the weighted risk score's "fatigue"
                                 component (breakdown.fatigue, based on
                                 restricted range-of-motion patterns) is
                                 60+ - suggests rest before the next
                                 session.
  5. "assessment_completed"   - fires on EVERY completed analysis,
                                 regardless of risk level - a simple "your
                                 results are ready" notice.

Each triggered alert is delivered two ways: an in-app Notification row
(bell icon) and an email (reusing services/email_service.py - no new SMTP
config needed). Email failures are logged, not raised - a flaky mail
server should never fail the analysis pipeline or hide the in-app alert.
"""
import logging

from sqlalchemy.orm import Session

from database import crud, models
from services import email_service

logger = logging.getLogger("uvicorn.error")

HIGH_RISK_LEVELS = {"Moderate", "High", "Critical"}

# Applies to the breakdown.training_load and breakdown.fatigue component
# scores (each 0-100) - same 60 cutoff used elsewhere for "High" on the
# overall/category risk labels, so all thresholds in this file mean the
# same thing: "at least High-equivalent".
COMPONENT_SCORE_THRESHOLD = 60.0


def notify_analysis_complete(
    db: Session,
    analysis_id: int,
    athlete: models.Athlete,
    risk_score_summary: dict,
    injury_risks: dict,
):
    """
    Call this right after an analysis is finalized. Looks at the results,
    fires whichever alert types apply, and returns the list of
    Notification rows created. "assessment_completed" always fires;
    the other 4 are conditional.
    """
    if not athlete:
        return []

    owner = athlete.owner  # the User who owns this athlete profile
    if not owner:
        return []

    created = []
    risk_score_summary = risk_score_summary or {}
    injury_risks = injury_risks or {}
    breakdown = risk_score_summary.get("breakdown") or {}

    # ---- Trigger 1: overall injury risk alert ----
    overall_level = risk_score_summary.get("risk_level")
    if overall_level in HIGH_RISK_LEVELS:
        overall_score = risk_score_summary.get("overall_score")
        title = f"{overall_level} injury risk detected"
        message = (
            f"Your latest analysis for athlete {athlete.athlete_id} came back with an overall "
            f"injury risk score of {overall_score}% ({overall_level}). Review the full "
            f"breakdown and corrective recommendations in your results."
        )
        created.append(
            _create_and_send(db, owner, "injury_risk_alert", title, message, analysis_id, athlete.athlete_id)
        )

    # ---- Trigger 2: high-risk movement alert(s) ----
    # One notification per flagged category, so the athlete knows exactly
    # which movement pattern(s) need attention rather than a vague summary.
    for category, details in injury_risks.items():
        level = (details or {}).get("risk_level")
        if level in HIGH_RISK_LEVELS:
            probability = (details or {}).get("probability")
            title = f"High-risk movement flagged: {category}"
            message = (
                f"Your latest analysis for athlete {athlete.athlete_id} flagged a {level} risk "
                f"({probability}% probability) for {category} injury, based on your movement "
                f"pattern in this session. See your results for the specific reasons and "
                f"corrective exercises."
            )
            created.append(
                _create_and_send(
                    db, owner, "high_risk_movement", title, message, analysis_id, athlete.athlete_id
                )
            )

    # ---- Trigger 3: training load warning ----
    training_load_score = breakdown.get("training_load")
    if training_load_score is not None and training_load_score >= COMPONENT_SCORE_THRESHOLD:
        title = "Training load warning"
        message = (
            f"Athlete {athlete.athlete_id}'s current training load is contributing "
            f"{training_load_score}% to their injury risk score - consistent with a heavy "
            f"training schedule. Consider reviewing training volume/intensity to reduce "
            f"overuse injury risk."
        )
        created.append(
            _create_and_send(db, owner, "training_load_warning", title, message, analysis_id, athlete.athlete_id)
        )

    # ---- Trigger 4: recovery reminder ----
    fatigue_score = breakdown.get("fatigue")
    if fatigue_score is not None and fatigue_score >= COMPONENT_SCORE_THRESHOLD:
        title = "Recovery reminder"
        message = (
            f"Athlete {athlete.athlete_id}'s movement pattern in this session shows signs of "
            f"fatigue (contributing {fatigue_score}% to the overall risk score) - restricted "
            f"range of motion is a common fatigue indicator. Consider prioritizing rest and "
            f"recovery before the next high-intensity session."
        )
        created.append(
            _create_and_send(db, owner, "recovery_reminder", title, message, analysis_id, athlete.athlete_id)
        )

    # ---- Trigger 5: assessment completion alert ----
    # Always fires, independent of risk level - a simple "it's ready" notice.
    title = "Your analysis is ready"
    message = (
        f"The analysis for athlete {athlete.athlete_id}'s latest video has finished processing. "
        f"View the full results, biomechanics breakdown, and recommendations now."
    )
    created.append(
        _create_and_send(db, owner, "assessment_completed", title, message, analysis_id, athlete.athlete_id)
    )

    return created


def _create_and_send(db, owner, type_, title, message, analysis_id, athlete_id):
    notification = crud.create_notification(
        db,
        user_id=owner.id,
        type=type_,
        title=title,
        message=message,
        analysis_id=analysis_id,
    )

    try:
        email_service.send_notification_email(owner.email, title, message, athlete_id=athlete_id)
    except Exception:
        # Matches the existing pattern elsewhere in this codebase (e.g.
        # background video processing): never let a downstream failure
        # (bad SMTP config, network blip) take down the caller. The in-app
        # notification above already succeeded regardless.
        logger.exception(f"Failed to send notification email to {owner.email}")

    return notification


def notify_access_request(db: Session, recipient: models.User, type: str, title: str, message: str, athlete_id: str = None):
    """
    NEW. Same in-app + email delivery as notify_analysis_complete, but for
    the 4 access-request lifecycle events (request sent / approved /
    denied / revoked) instead of analysis results. No analysis_id applies
    here, so it's passed as None.

    type is one of: "access_request_received", "access_request_approved",
    "access_request_denied", "access_revoked".
    """
    return _create_and_send(db, recipient, type, title, message, analysis_id=None, athlete_id=athlete_id)