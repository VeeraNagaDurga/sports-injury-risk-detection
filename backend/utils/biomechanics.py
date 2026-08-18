import math

# ---------------------------------------------------------
# Calculate Angle Between Three Points
# ---------------------------------------------------------

def calculate_angle(a, b, c):
    """
    Calculates the angle ABC.
    """

    angle = math.degrees(

        math.atan2(c.y - b.y, c.x - b.x)

        -

        math.atan2(a.y - b.y, a.x - b.x)

    )

    angle = abs(angle)

    if angle > 180:

        angle = 360 - angle

    return round(angle, 2)


# ---------------------------------------------------------
# Calculate Joint Angles
# ---------------------------------------------------------

def calculate_joint_angles(joints):

    if not joints:
        return {}

    angles = {

        "left_elbow":

            calculate_angle(

                joints["LEFT_SHOULDER"],
                joints["LEFT_ELBOW"],
                joints["LEFT_WRIST"]

            ),

        "right_elbow":

            calculate_angle(

                joints["RIGHT_SHOULDER"],
                joints["RIGHT_ELBOW"],
                joints["RIGHT_WRIST"]

            ),

        "left_knee":

            calculate_angle(

                joints["LEFT_HIP"],
                joints["LEFT_KNEE"],
                joints["LEFT_ANKLE"]

            ),

        "right_knee":

            calculate_angle(

                joints["RIGHT_HIP"],
                joints["RIGHT_KNEE"],
                joints["RIGHT_ANKLE"]

            ),

        "left_hip":

            calculate_angle(

                joints["LEFT_SHOULDER"],
                joints["LEFT_HIP"],
                joints["LEFT_KNEE"]

            ),

        "right_hip":

            calculate_angle(

                joints["RIGHT_SHOULDER"],
                joints["RIGHT_HIP"],
                joints["RIGHT_KNEE"]

            )

    }

    return angles


# ---------------------------------------------------------
# Range of Motion
# ---------------------------------------------------------

def calculate_range_of_motion(joint_angles):

    if not joint_angles:
        return {}

    rom = {}

    for joint, angle in joint_angles.items():

        rom[joint] = {

            "angle": angle,

            "status":

                "Normal"

                if 30 <= angle <= 170

                else "Abnormal"

        }

    return rom


# ---------------------------------------------------------
# Movement Symmetry
# ---------------------------------------------------------

def calculate_symmetry(joint_angles):

    if not joint_angles:
        return {}

    symmetry = {}

    pairs = [

        ("left_elbow", "right_elbow"),

        ("left_knee", "right_knee"),

        ("left_hip", "right_hip")

    ]

    for left, right in pairs:

        difference = abs(

            joint_angles[left]

            -

            joint_angles[right]

        )

        symmetry[left.replace("left_", "")] = {

            "difference": round(difference, 2),

            "status":

                "Symmetrical"

                if difference < 10

                else "Asymmetrical"

        }

    return symmetry


# ---------------------------------------------------------
# Trunk Lean
# ---------------------------------------------------------

def calculate_trunk_lean(joints):

    if not joints:

        return 0

    shoulder_center_x = (

        joints["LEFT_SHOULDER"].x

        +

        joints["RIGHT_SHOULDER"].x

    ) / 2

    hip_center_x = (

        joints["LEFT_HIP"].x

        +

        joints["RIGHT_HIP"].x

    ) / 2

    lean = abs(

        shoulder_center_x

        -

        hip_center_x

    )

    return round(lean * 100, 2)


# ---------------------------------------------------------
# Knee Valgus
# ---------------------------------------------------------

def calculate_knee_valgus(joints):

    if not joints:
        return {}

    left = abs(

        joints["LEFT_KNEE"].x

        -

        joints["LEFT_ANKLE"].x

    )

    right = abs(

        joints["RIGHT_KNEE"].x

        -

        joints["RIGHT_ANKLE"].x

    )

    return {

        "left_knee":

            "Normal"

            if left < 0.10

            else "Valgus",

        "right_knee":

            "Normal"

            if right < 0.10

            else "Valgus"

    }


# ---------------------------------------------------------
# Overall Biomechanics
# ---------------------------------------------------------

def analyze_biomechanics(joints):
    from utils.pose_estimation import ensure_joint_objects
    obj_joints = ensure_joint_objects(joints)
    joint_angles = calculate_joint_angles(obj_joints)

    return {

        "joint_angles":

            joint_angles,

        "range_of_motion":

            calculate_range_of_motion(

                joint_angles

            ),

        "symmetry":

            calculate_symmetry(

                joint_angles

            ),

        "trunk_lean":

            calculate_trunk_lean(

                obj_joints

            ),

        "knee_valgus":

            calculate_knee_valgus(

                obj_joints

            )

    }


# ---------------------------------------------------------
# Per-Frame Issue Severity (for flagging "problem moment" frames)
# ---------------------------------------------------------
#
# NEW. Reuses analyze_biomechanics() (single frame) above and its
# already-established thresholds - does not invent any new ones:
#   - knee valgus: deviation > 0.10 (see calculate_knee_valgus)
#   - asymmetry: left/right angle difference >= 10 degrees (see calculate_symmetry)
#   - range of motion: angle outside 30-170 degrees is "Abnormal" (see calculate_range_of_motion)
#
# Returns a list of issue dicts for this single frame:
#   label          - human-readable issue name
#   severity       - "how far past the threshold, as a ratio" (1.0 = right at
#                    the threshold, 2.0 = twice as far past it, etc.) - lets
#                    frames with different issue types be ranked against
#                    each other on one common scale
#   joint_keys     - which JointPoint keys (from extract_joint_coordinates)
#                    are responsible for this issue, in draw order
#   primary_joint  - the single joint_key to anchor a label/circle on
#   detail         - the exact measured value, human-readable
# Returns an empty list for a clean frame with no flagged issues.
SYMMETRY_JOINTS = {
    "elbow": ("LEFT_ELBOW", "RIGHT_ELBOW"),
    "knee": ("LEFT_KNEE", "RIGHT_KNEE"),
    "hip": ("LEFT_HIP", "RIGHT_HIP"),
}

ANGLE_JOINT_CHAINS = {
    "left_elbow": ("LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
    "right_elbow": ("RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"),
    "left_knee": ("LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"),
    "right_knee": ("RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"),
    "left_hip": ("LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"),
    "right_hip": ("RIGHT_SHOULDER", "RIGHT_HIP", "RIGHT_KNEE"),
}


def score_frame_issues(joints):
    from utils.pose_estimation import ensure_joint_objects

    obj_joints = ensure_joint_objects(joints)
    result = analyze_biomechanics(obj_joints)
    issues = []

    knee_valgus = result["knee_valgus"]
    if knee_valgus.get("left_knee") == "Valgus":
        dev = abs(obj_joints["LEFT_KNEE"].x - obj_joints["LEFT_ANKLE"].x)
        issues.append({
            "label": "Left Knee Valgus",
            "severity": round(dev / 0.10, 2),
            "joint_keys": ["LEFT_KNEE", "LEFT_ANKLE"],
            "primary_joint": "LEFT_KNEE",
            "detail": f"knee-ankle deviation {round(dev, 3)} (threshold 0.10)",
        })
    if knee_valgus.get("right_knee") == "Valgus":
        dev = abs(obj_joints["RIGHT_KNEE"].x - obj_joints["RIGHT_ANKLE"].x)
        issues.append({
            "label": "Right Knee Valgus",
            "severity": round(dev / 0.10, 2),
            "joint_keys": ["RIGHT_KNEE", "RIGHT_ANKLE"],
            "primary_joint": "RIGHT_KNEE",
            "detail": f"knee-ankle deviation {round(dev, 3)} (threshold 0.10)",
        })

    for joint_name, info in result["symmetry"].items():
        if info["status"] == "Asymmetrical":
            left_key, right_key = SYMMETRY_JOINTS.get(joint_name, (None, None))
            issues.append({
                "label": f"{joint_name.capitalize()} Asymmetry",
                "severity": round(info["difference"] / 10.0, 2),
                "joint_keys": [k for k in (left_key, right_key) if k],
                "primary_joint": left_key,
                "detail": f"{info['difference']}\u00b0 left/right difference (threshold 10\u00b0)",
            })

    for joint_name, info in result["range_of_motion"].items():
        if info["status"] == "Abnormal":
            angle = info["angle"]
            distance_outside = (30 - angle) if angle < 30 else (angle - 170)
            chain = ANGLE_JOINT_CHAINS.get(joint_name, ())
            issues.append({
                "label": f"{joint_name.replace('_', ' ').title()} Abnormal Range",
                "severity": round(distance_outside / 10.0, 2),
                "joint_keys": list(chain),
                "primary_joint": chain[1] if len(chain) == 3 else (chain[0] if chain else None),
                "detail": f"{angle}\u00b0 (normal range 30\u00b0-170\u00b0)",
            })

    return issues


def analyze_sequence_biomechanics(joints_list):
    """
    Analyzes biomechanics over a sequence of frames.
    joints_list: list of dictionaries representing joints in each frame.
    """
    from utils.pose_estimation import ensure_joint_objects
    
    if not joints_list:
        return {
            "joint_angles": {},
            "range_of_motion": {},
            "symmetry": {},
            "trunk_lean": 0.0,
            "knee_valgus": {"left_knee": "Normal", "right_knee": "Normal"},
            "valgus_details": {"left_valgus_percentage": 0.0, "right_valgus_percentage": 0.0},
            "peak_metrics": {
                "max_trunk_lean": 0.0,
                "max_left_knee_valgus_dev": 0.0,
                "max_right_knee_valgus_dev": 0.0
            }
        }

    elbow_left_angles = []
    elbow_right_angles = []
    knee_left_angles = []
    knee_right_angles = []
    hip_left_angles = []
    hip_right_angles = []
    trunk_leans = []
    left_valgus_devs = []
    right_valgus_devs = []

    for frame_joints in joints_list:
        joints = ensure_joint_objects(frame_joints)
        if not joints:
            continue

        angles = calculate_joint_angles(joints)
        if angles:
            if "left_elbow" in angles: elbow_left_angles.append(angles["left_elbow"])
            if "right_elbow" in angles: elbow_right_angles.append(angles["right_elbow"])
            if "left_knee" in angles: knee_left_angles.append(angles["left_knee"])
            if "right_knee" in angles: knee_right_angles.append(angles["right_knee"])
            if "left_hip" in angles: hip_left_angles.append(angles["left_hip"])
            if "right_hip" in angles: hip_right_angles.append(angles["right_hip"])

        lean = calculate_trunk_lean(joints)
        trunk_leans.append(lean)

        # Calculate deviation in X coordinates (knee to ankle)
        if "LEFT_KNEE" in joints and "LEFT_ANKLE" in joints:
            left_valgus_devs.append(abs(joints["LEFT_KNEE"].x - joints["LEFT_ANKLE"].x))
        if "RIGHT_KNEE" in joints and "RIGHT_ANKLE" in joints:
            right_valgus_devs.append(abs(joints["RIGHT_KNEE"].x - joints["RIGHT_ANKLE"].x))

    def get_stats(angles):
        if not angles:
            return 0.0, 0.0, 0.0
        return min(angles), max(angles), round(sum(angles)/len(angles), 2)

    rom = {}
    for joint_name, angle_list in [
        ("left_elbow", elbow_left_angles),
        ("right_elbow", elbow_right_angles),
        ("left_knee", knee_left_angles),
        ("right_knee", knee_right_angles),
        ("left_hip", hip_left_angles),
        ("right_hip", hip_right_angles)
    ]:
        if angle_list:
            j_min, j_max, j_avg = get_stats(angle_list)
            j_rom = round(j_max - j_min, 2)
            if "knee" in joint_name:
                status = "Normal" if j_rom >= 80 else "Restricted"
            elif "hip" in joint_name:
                status = "Normal" if j_rom >= 60 else "Restricted"
            else:
                status = "Normal" if j_rom >= 60 else "Restricted"
            
            rom[joint_name] = {
                "min": j_min,
                "max": j_max,
                "avg": j_avg,
                "rom": j_rom,
                "status": status
            }
        else:
            rom[joint_name] = {"min": 0, "max": 0, "avg": 0, "rom": 0, "status": "Unknown"}

    latest_angles = {}
    for k, v in rom.items():
        latest_angles[k] = v["avg"]

    symmetry = {}
    pairs = [
        ("left_elbow", "right_elbow"),
        ("left_knee", "right_knee"),
        ("left_hip", "right_hip")
    ]
    for left, right in pairs:
        left_list = elbow_left_angles if "elbow" in left else (knee_left_angles if "knee" in left else hip_left_angles)
        right_list = elbow_right_angles if "elbow" in right else (knee_right_angles if "knee" in right else hip_right_angles)
        
        diffs = []
        for l_ang, r_ang in zip(left_list, right_list):
            diffs.append(abs(l_ang - r_ang))
        
        avg_diff = round(sum(diffs)/len(diffs), 2) if diffs else 0.0
        symmetry[left.replace("left_", "")] = {
            "difference": avg_diff,
            "status": "Symmetrical" if avg_diff < 10.0 else "Asymmetrical"
        }

    max_lean = max(trunk_leans) if trunk_leans else 0.0
    avg_lean = round(sum(trunk_leans)/len(trunk_leans), 2) if trunk_leans else 0.0
    
    left_valgus_count = sum(1 for d in left_valgus_devs if d > 0.10)
    right_valgus_count = sum(1 for d in right_valgus_devs if d > 0.10)
    
    left_valgus_pct = round((left_valgus_count / len(left_valgus_devs)) * 100, 2) if left_valgus_devs else 0.0
    right_valgus_pct = round((right_valgus_count / len(right_valgus_devs)) * 100, 2) if right_valgus_devs else 0.0

    return {
        "joint_angles": latest_angles,
        "range_of_motion": rom,
        "symmetry": symmetry,
        "trunk_lean": avg_lean,
        "knee_valgus": {
            "left_knee": "Valgus" if left_valgus_pct > 15.0 else "Normal",
            "right_knee": "Valgus" if right_valgus_pct > 15.0 else "Normal"
        },
        "valgus_details": {
            "left_valgus_percentage": left_valgus_pct,
            "right_valgus_percentage": right_valgus_pct
        },
        "peak_metrics": {
            "max_trunk_lean": max_lean,
            "max_left_knee_valgus_dev": round(max(left_valgus_devs), 4) if left_valgus_devs else 0.0,
            "max_right_knee_valgus_dev": round(max(right_valgus_devs), 4) if right_valgus_devs else 0.0
        }
    }