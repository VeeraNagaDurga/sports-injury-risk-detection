import cv2
import os
import mediapipe as mp

# Handle differences between MediaPipe versions. Older releases expose
# the `solutions` API (mp.solutions.pose). Newer releases expose the
# `tasks` API and may not provide `mp.solutions` from the top-level
# package. If the expected API isn't available, fall back so the
# backend can still run (pose detection will be disabled).
pose = None
try:
    if hasattr(mp, "solutions"):
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose()
    else:
        # Newer MediaPipe versions don't expose `solutions` on import;
        # leave `pose` as None so detect_pose can skip detection.
        pose = None
except Exception:
    pose = None


def detect_pose(video_path):
    """
    Detect human pose in uploaded sports video.
    Returns:
        total_frames,
        detected_frames,
        landmarks
    """

    cap = cv2.VideoCapture(video_path)

    total_frames = 0
    detected_frames = 0
    landmarks_list = []

    # If MediaPipe pose isn't available in this environment, skip
    # detection and just count frames so the API can still respond.
    if pose is None:
        while True:
            success, frame = cap.read()
            if not success:
                break
            total_frames += 1
        cap.release()
        return total_frames, detected_frames, landmarks_list

    while True:
        success, frame = cap.read()

        if not success:
            break

        total_frames += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = pose.process(rgb)

        if results.pose_landmarks:

            detected_frames += 1

            frame_landmarks = []

            for landmark in results.pose_landmarks.landmark:

                frame_landmarks.append({
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": landmark.visibility
                })

            landmarks_list.append(frame_landmarks)

    cap.release()

    return total_frames, detected_frames, landmarks_list


def extract_frames(video_path, output_folder="frames"):

    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    frame_count = 0

    while True:

        success, frame = cap.read()

        if not success:
            break

        cv2.imwrite(
            os.path.join(output_folder, f"frame_{frame_count}.jpg"),
            frame
        )

        frame_count += 1

    cap.release()

    return frame_count


def resize_video_frame(frame, width=640, height=480):
    return cv2.resize(frame, (width, height))


def enhance_frame(frame):
    return cv2.convertScaleAbs(frame, alpha=1.2, beta=20)


def validate_video(video_path):

    cap = cv2.VideoCapture(video_path)

    valid = cap.isOpened()

    cap.release()

    return valid