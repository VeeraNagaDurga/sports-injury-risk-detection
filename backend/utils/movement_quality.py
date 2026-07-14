def calculate_movement_quality(metrics):
    """
    Calculate an overall movement quality score based on
    biomechanical metrics.
    """

    score = 100

    penalties = []

    # -----------------------------
    # Knee Angles
    # -----------------------------

    left_knee = metrics.get("left_knee")
    right_knee = metrics.get("right_knee")

    if left_knee is not None:

        if left_knee < 150:
            score -= 10
            penalties.append("Left knee angle is below optimal range.")

    if right_knee is not None:

        if right_knee < 150:
            score -= 10
            penalties.append("Right knee angle is below optimal range.")

    # -----------------------------
    # Hip Angles
    # -----------------------------

    left_hip = metrics.get("left_hip")
    right_hip = metrics.get("right_hip")

    if left_hip is not None:

        if left_hip < 140:
            score -= 8
            penalties.append("Left hip mobility needs improvement.")

    if right_hip is not None:

        if right_hip < 140:
            score -= 8
            penalties.append("Right hip mobility needs improvement.")

    # -----------------------------
    # Score Limits
    # -----------------------------

    score = max(0, score)

    # -----------------------------
    # Rating
    # -----------------------------

    if score >= 90:
        rating = "Excellent"

    elif score >= 75:
        rating = "Good"

    elif score >= 60:
        rating = "Moderate"

    else:
        rating = "Poor"

    return {
        "score": score,
        "rating": rating,
        "remarks": penalties
    }