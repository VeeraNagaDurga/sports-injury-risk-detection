import cv2

def extract_frames(video_path):
    cap = cv2.VideoCapture(video_path)

    frame_count = 0

    while cap.isOpened():

        ret, frame = cap.read()

        if not ret:
            break

        frame_count += 1

    cap.release()

    return frame_count