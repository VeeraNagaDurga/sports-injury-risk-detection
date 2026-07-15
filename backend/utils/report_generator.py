from datetime import datetime


def generate_biomechanics_report(
    athlete_name,
    filename,
    total_frames,
    detected_frames,
    metrics,
    movement_quality
):
    """
    Generate a biomechanics report after pose analysis.
    """

    report = {
        "report_generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),

        "athlete": athlete_name,

        "video": filename,

        "video_analysis": {
            "total_frames": total_frames,
            "pose_detected_frames": detected_frames,
            "pose_detection_percentage": round(
                (detected_frames / total_frames) * 100,
                2
            ) if total_frames else 0
        },

        "joint_angles": {

            "left_knee": metrics.get("left_knee"),

            "right_knee": metrics.get("right_knee"),

            "left_hip": metrics.get("left_hip"),

            "right_hip": metrics.get("right_hip"),

            "left_elbow": metrics.get("left_elbow"),

            "right_elbow": metrics.get("right_elbow"),

            "left_shoulder": metrics.get("left_shoulder"),

            "right_shoulder": metrics.get("right_shoulder")

        },

        "movement_quality": movement_quality,

        "recommendation": generate_recommendation(movement_quality)
    }

    return report


def generate_recommendation(movement_quality):
    """
    Generate recommendations based on movement quality score.
    """

    score = movement_quality["score"]

    if score >= 90:
        return (
            "Excellent movement quality. Continue maintaining "
            "proper biomechanics during training."
        )

    elif score >= 75:
        return (
            "Good movement quality. Minor posture improvements "
            "can further reduce injury risk."
        )

    elif score >= 60:
        return (
            "Moderate movement quality. Focus on flexibility, "
            "balance and joint stability exercises."
        )

    else:
        return (
            "Poor movement quality detected. Professional "
            "biomechanical assessment is recommended."
        )