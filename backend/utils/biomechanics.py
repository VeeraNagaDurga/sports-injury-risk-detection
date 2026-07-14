"""
Biomechanics Analysis Module

This module calculates joint angles required for
sports injury risk assessment.
"""

from utils.pose_analysis import calculate_angle


# ---------------------------------------------------------
# Generic Joint Angle
# ---------------------------------------------------------

def get_angle(point1, point2, point3):
    """
    Calculate angle using three MediaPipe landmarks.
    """

    return calculate_angle(
        (point1.x, point1.y),
        (point2.x, point2.y),
        (point3.x, point3.y)
    )


# ---------------------------------------------------------
# Knee Angle
# ---------------------------------------------------------

def calculate_knee_angle(joints, side="LEFT"):

    hip = joints[f"{side}_HIP"]
    knee = joints[f"{side}_KNEE"]
    ankle = joints[f"{side}_ANKLE"]

    return get_angle(
        hip,
        knee,
        ankle
    )


# ---------------------------------------------------------
# Hip Angle
# ---------------------------------------------------------

def calculate_hip_angle(joints, side="LEFT"):

    shoulder = joints[f"{side}_SHOULDER"]
    hip = joints[f"{side}_HIP"]
    knee = joints[f"{side}_KNEE"]

    return get_angle(
        shoulder,
        hip,
        knee
    )


# ---------------------------------------------------------
# Elbow Angle
# ---------------------------------------------------------

def calculate_elbow_angle(joints, side="LEFT"):

    shoulder = joints[f"{side}_SHOULDER"]
    elbow = joints[f"{side}_ELBOW"]
    wrist = joints[f"{side}_WRIST"]

    return get_angle(
        shoulder,
        elbow,
        wrist
    )


# ---------------------------------------------------------
# Shoulder Angle
# ---------------------------------------------------------

def calculate_shoulder_angle(joints, side="LEFT"):

    hip = joints[f"{side}_HIP"]
    shoulder = joints[f"{side}_SHOULDER"]
    elbow = joints[f"{side}_ELBOW"]

    return get_angle(
        hip,
        shoulder,
        elbow
    )


# ---------------------------------------------------------
# Calculate All Angles
# ---------------------------------------------------------

def calculate_all_joint_angles(joints):
    """
    Calculate all biomechanical angles.
    """

    metrics = {

        "left_knee":
            calculate_knee_angle(joints, "LEFT"),

        "right_knee":
            calculate_knee_angle(joints, "RIGHT"),

        "left_hip":
            calculate_hip_angle(joints, "LEFT"),

        "right_hip":
            calculate_hip_angle(joints, "RIGHT"),

        "left_elbow":
            calculate_elbow_angle(joints, "LEFT"),

        "right_elbow":
            calculate_elbow_angle(joints, "RIGHT"),

        "left_shoulder":
            calculate_shoulder_angle(joints, "LEFT"),

        "right_shoulder":
            calculate_shoulder_angle(joints, "RIGHT")

    }

    return metrics


# ---------------------------------------------------------
# Movement Symmetry
# ---------------------------------------------------------

def calculate_symmetry(metrics):
    """
    Compare left and right joint angles.
    """

    symmetry = {}

    symmetry["knee_difference"] = abs(
        metrics["left_knee"] -
        metrics["right_knee"]
    )

    symmetry["hip_difference"] = abs(
        metrics["left_hip"] -
        metrics["right_hip"]
    )

    symmetry["elbow_difference"] = abs(
        metrics["left_elbow"] -
        metrics["right_elbow"]
    )

    symmetry["shoulder_difference"] = abs(
        metrics["left_shoulder"] -
        metrics["right_shoulder"]
    )

    return symmetry


# ---------------------------------------------------------
# Range of Motion
# ---------------------------------------------------------

def calculate_range_of_motion(metrics):
    """
    Placeholder for ROM calculation.

    This will be expanded in Milestone 3.
    """

    return {

        "knee_rom":
            (
                metrics["left_knee"] +
                metrics["right_knee"]
            ) / 2,

        "hip_rom":
            (
                metrics["left_hip"] +
                metrics["right_hip"]
            ) / 2

    }


# ---------------------------------------------------------
# Complete Biomechanics Analysis
# ---------------------------------------------------------

def analyze_biomechanics(joints):
    """
    Perform complete biomechanics analysis.
    """

    metrics = calculate_all_joint_angles(
        joints
    )

    symmetry = calculate_symmetry(
        metrics
    )

    rom = calculate_range_of_motion(
        metrics
    )

    return {

        "joint_angles": metrics,

        "symmetry": symmetry,

        "range_of_motion": rom

    }