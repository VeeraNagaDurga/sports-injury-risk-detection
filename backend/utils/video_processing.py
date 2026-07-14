import os
import cv2
import mediapipe as mp
import numpy as np

# ---------------------------------------------------------
# MediaPipe Initialization
# ---------------------------------------------------------

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ---------------------------------------------------------
# Video Validation
# ---------------------------------------------------------

def validate_video(video_path):
    """
    Validate whether the uploaded video can be opened.
    """

    cap = cv2.VideoCapture(video_path)

    valid = cap.isOpened()

    cap.release()

    return valid


# ---------------------------------------------------------
# Resize Frame
# ---------------------------------------------------------

def resize_video_frame(frame, width=640, height=480):
    """
    Resize a frame.
    """
    return cv2.resize(frame, (width, height))


# ---------------------------------------------------------
# Enhance Frame
# ---------------------------------------------------------

def enhance_frame(frame):
    """
    Improve brightness and contrast.
    """
    return cv2.convertScaleAbs(frame, alpha=1.2, beta=20)


# ---------------------------------------------------------
# Extract Frames
# ---------------------------------------------------------

def extract_frames(video_path, output_folder="frames"):
    """
    Save all frames from a video.
    """

    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    frame_count = 0

    while True:

        success, frame = cap.read()

        if not success:
            break

        frame_path = os.path.join(
            output_folder,
            f"frame_{frame_count}.jpg"
        )

        cv2.imwrite(frame_path, frame)

        frame_count += 1

    cap.release()

    return frame_count


# ---------------------------------------------------------
# Extract Important Joint Coordinates
# ---------------------------------------------------------

def extract_joint_coordinates(landmarks):
    """
    Extract important body joints from MediaPipe landmarks.
    """

    return {

        "LEFT_SHOULDER": landmarks[11],
        "RIGHT_SHOULDER": landmarks[12],

        "LEFT_ELBOW": landmarks[13],
        "RIGHT_ELBOW": landmarks[14],

        "LEFT_WRIST": landmarks[15],
        "RIGHT_WRIST": landmarks[16],

        "LEFT_HIP": landmarks[23],
        "RIGHT_HIP": landmarks[24],

        "LEFT_KNEE": landmarks[25],
        "RIGHT_KNEE": landmarks[26],

        "LEFT_ANKLE": landmarks[27],
        "RIGHT_ANKLE": landmarks[28]
    }


# ---------------------------------------------------------
# Detect Pose
# ---------------------------------------------------------

def detect_pose(video_path):
    """
    Detect pose landmarks in a sports video.

    Returns
    -------
    dict
        {
            total_frames,
            detected_frames,
            landmarks,
            joints
        }
    """

    cap = cv2.VideoCapture(video_path)

    total_frames = 0
    detected_frames = 0

    landmark_history = []

    latest_joints = {}

    while True:

        success, frame = cap.read()

        if not success:
            break

        total_frames += 1

        frame = enhance_frame(frame)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = pose.process(rgb)

        if results.pose_landmarks:

            detected_frames += 1

            landmarks = results.pose_landmarks.landmark

            landmark_history.append(landmarks)

            latest_joints = extract_joint_coordinates(
                landmarks
            )

    cap.release()

    return {

        "total_frames": total_frames,

        "detected_frames": detected_frames,

        "landmarks": landmark_history,

        "joints": latest_joints

    }
# ---------------------------------------------------------
# Draw Pose Skeleton
# ---------------------------------------------------------

def draw_pose_skeleton(frame, results):
    """
    Draw MediaPipe pose skeleton on a frame.
    """

    if results.pose_landmarks is None:
        return frame

    mp_drawing.draw_landmarks(
        frame,
        results.pose_landmarks,
        mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=mp_drawing.DrawingSpec(
            color=(0, 255, 0),
            thickness=2,
            circle_radius=2
        ),
        connection_drawing_spec=mp_drawing.DrawingSpec(
            color=(255, 0, 0),
            thickness=2
        )
    )

    return frame


# ---------------------------------------------------------
# Track Joint Motion
# ---------------------------------------------------------

def track_joint_motion(joint_history, joints):
    """
    Store joint movement across frames.
    """

    for name, landmark in joints.items():

        if name not in joint_history:
            joint_history[name] = []

        joint_history[name].append(
            (
                landmark.x,
                landmark.y
            )
        )

    return joint_history


# ---------------------------------------------------------
# Process Video With Skeleton
# ---------------------------------------------------------

def process_video_with_skeleton(
    video_path,
    output_folder="processed_videos"
):
    """
    Process uploaded sports video.

    Returns
    -------
    dict
    """

    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))

    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fps = cap.get(cv2.CAP_PROP_FPS)

    output_path = os.path.join(
        output_folder,
        f"processed_{os.path.basename(video_path)}"
    )

    writer = cv2.VideoWriter(
        output_path,
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height)
    )

    total_frames = 0

    detected_frames = 0

    landmark_history = []

    joint_history = {}

    latest_joints = {}

    while True:

        success, frame = cap.read()

        if not success:
            break

        total_frames += 1

        frame = enhance_frame(frame)

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        results = pose.process(rgb)

        if results.pose_landmarks:

            detected_frames += 1

            landmarks = results.pose_landmarks.landmark

            landmark_history.append(landmarks)

            latest_joints = extract_joint_coordinates(
                landmarks
            )

            joint_history = track_joint_motion(
                joint_history,
                latest_joints
            )

            frame = draw_pose_skeleton(
                frame,
                results
            )

        writer.write(frame)

    cap.release()

    writer.release()

    return {

        "processed_video": output_path,

        "total_frames": total_frames,

        "detected_frames": detected_frames,

        "landmarks": landmark_history,

        "joints": latest_joints,

        "joint_history": joint_history

    }


# ---------------------------------------------------------
# Get Video Information
# ---------------------------------------------------------

def get_video_information(video_path):
    """
    Return metadata about a video.
    """

    cap = cv2.VideoCapture(video_path)

    info = {

        "width": int(
            cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        ),

        "height": int(
            cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        ),

        "fps": cap.get(
            cv2.CAP_PROP_FPS
        ),

        "frame_count": int(
            cap.get(cv2.CAP_PROP_FRAME_COUNT)
        )

    }

    cap.release()

    return info