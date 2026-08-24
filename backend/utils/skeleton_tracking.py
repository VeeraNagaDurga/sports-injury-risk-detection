import heapq
import os
import re
import shutil
import subprocess
from pathlib import Path
 
import cv2
 
from utils.pose_estimation import (
    detect_pose,
    draw_pose,
    draw_risk_markers,
    label_frame,
    extract_joint_coordinates,
    calculate_visibility,
)
from utils.biomechanics import score_frame_issues
 
 
# Known-good fallback locations, used only if ffmpeg isn't found on PATH
# (e.g. right after a winget install, before the shell/PATH has refreshed).
# You can also set the FFMPEG_PATH environment variable to override this.
_FFMPEG_FALLBACK_CANDIDATES = [
    os.environ.get("FFMPEG_PATH", ""),
    os.path.expandvars(
        r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
        r"\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
    ),
]
 
 
def _resolve_ffmpeg():
    """Return a usable ffmpeg executable path, or raise a clear error."""
    on_path = shutil.which("ffmpeg")
    if on_path:
        return on_path
 
    for candidate in _FFMPEG_FALLBACK_CANDIDATES:
        if candidate and os.path.isfile(candidate):
            return candidate
 
    raise Exception(
        "ffmpeg is not on PATH and no fallback location was found. "
        "Either fix your PATH (reboot after installing via winget), or set the "
        "FFMPEG_PATH environment variable to the full path of ffmpeg.exe."
    )
 
 
# ---------------------------------------------------------
# Process Video with Skeleton Tracking
# ---------------------------------------------------------
 
def process_video_with_skeleton(video_path, output_folder="processed_videos"):
    """
    Detect pose for every frame, draw skeleton, and save a processed,
    browser-playable video.
 
    IMPORTANT: this function always returns exactly ONE final file, named
    deterministically from the input filename. There is no prefix-stripping
    / re-processing logic here anymore - that was the source of the
    'processed_processed_...' duplicate files. The caller (main.py) is
    responsible for handing this function an already-unique, already-safe
    filename (no spaces/special characters), so we just prefix it once.
    """
 
    os.makedirs(output_folder, exist_ok=True)
 
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception(f"Unable to open video: {video_path}")
 
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
 
    if width <= 0 or height <= 0:
        cap.release()
        raise Exception("Invalid video resolution.")
    if fps <= 0:
        fps = 30
 
    ffmpeg_exe = _resolve_ffmpeg()
 
    input_stem = Path(video_path).stem
    final_filename = f"processed_{input_stem}.mp4"
    final_path = os.path.abspath(os.path.join(output_folder, final_filename))
 
    # Raw intermediate file written with OpenCV's mp4v codec. mp4v is NOT
    # H.264 - it plays fine in Windows Media Player / VLC (which have the
    # codec installed natively) but Chrome/Firefox/Safari cannot decode it
    # at all. This is why the video "plays" locally but sits frozen at 0:00
    # in the React <video> tag. We always re-encode it below before serving
    # anything to the frontend.
    raw_path = os.path.abspath(os.path.join(output_folder, f"_raw_{input_stem}.mp4"))
 
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(raw_path, fourcc, fps, (width, height))
    if not writer.isOpened():
        cap.release()
        raise Exception(f"Unable to create output video:\n{raw_path}")
 
    total_frames = 0
    detected_frames = 0
    latest_joints = {}
    all_joints = []
    visibility_scores = []

    # "Problem moment" frame flagging - keeps a rolling top-N of the worst
    # frames seen so far (by biomechanics.score_frame_issues, which reuses
    # the SAME thresholds already used elsewhere in this project: knee
    # valgus > 0.10, asymmetry >= 10 deg, ROM outside 30-170 deg). A
    # min-heap of (severity, tie_breaker, frame_index, issue_label, detail,
    # jpeg_bytes) - the smallest-severity entry is always at heap[0], so a
    # new worse frame can cheaply evict it. JPEG-encoding only happens for
    # frames that are actually candidates, not every frame, to keep this
    # cheap even on long videos. The saved frame has the exact joint(s) at
    # fault circled and labeled with the measured value, via
    # draw_risk_markers() - not just a plain skeleton snapshot.
    MAX_FLAGGED_FRAMES = 6
    flagged_heap = []
    flagged_tiebreak = 0

    # NEW. "Movement phase" reference frames - evenly spaced across the
    # WHOLE clip (not just problem moments), so the athlete can see the
    # skeleton tracking through the entire motion (e.g. takeoff / mid-air /
    # landing for a jump), not only the isolated instants that got
    # flagged. Any phase frame that happens to coincide with a flagged
    # issue also gets the same joint markers drawn on it.
    frame_count_hint = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if frame_count_hint <= 0:
        frame_count_hint = 300  # generous fallback for containers that don't report frame count
    PHASE_FRACTIONS = [0.1, 0.35, 0.6, 0.85]
    phase_target_indices = sorted(
        {max(1, round(frame_count_hint * f)) for f in PHASE_FRACTIONS}
    )
    next_phase = 0
    phase_frames_raw = []

    while True:
        success, frame = cap.read()
        if not success:
            break

        total_frames += 1
        results = detect_pose(frame)

        issues = []
        if results.pose_landmarks:
            detected_frames += 1
            latest_joints = extract_joint_coordinates(results)
            all_joints.append({k: v.to_dict() for k, v in latest_joints.items()})
            visibility_scores.append(calculate_visibility(results))
            issues = score_frame_issues(latest_joints)

        frame = draw_pose(frame, results)
        writer.write(frame)

        if issues:
            worst = max(issues, key=lambda x: x["severity"])
            would_qualify = (
                len(flagged_heap) < MAX_FLAGGED_FRAMES
                or worst["severity"] > flagged_heap[0][0]
            )
            if would_qualify:
                annotated = draw_risk_markers(frame.copy(), latest_joints, worst)
                ok, buf = cv2.imencode(".jpg", annotated)
                if ok:
                    flagged_tiebreak += 1
                    entry = (
                        worst["severity"],
                        flagged_tiebreak,
                        total_frames,
                        worst["label"],
                        worst.get("detail", ""),
                        buf.tobytes(),
                    )
                    if len(flagged_heap) < MAX_FLAGGED_FRAMES:
                        heapq.heappush(flagged_heap, entry)
                    else:
                        heapq.heappushpop(flagged_heap, entry)

        if next_phase < len(phase_target_indices) and total_frames >= phase_target_indices[next_phase]:
            phase_copy = frame.copy()
            phase_issue_label = None
            phase_detail = None
            if issues:
                top = max(issues, key=lambda x: x["severity"])
                phase_copy = draw_risk_markers(phase_copy, latest_joints, top)
                phase_issue_label = top["label"]
                phase_detail = top.get("detail")
            label_frame(phase_copy, f"Movement Phase {next_phase + 1}")
            ok, buf = cv2.imencode(".jpg", phase_copy)
            if ok:
                phase_frames_raw.append({
                    "phase_number": next_phase + 1,
                    "frame_index": total_frames,
                    "timestamp_seconds": round(total_frames / fps, 1) if fps else None,
                    "issue": phase_issue_label,
                    "detail": phase_detail,
                    "jpeg_bytes": buf.tobytes(),
                })
            next_phase += 1

    cap.release()
    writer.release()
    cv2.destroyAllWindows()
 
    if not os.path.exists(raw_path):
        raise Exception(f"Raw processed video was not created.\nExpected:\n{raw_path}")
 
    # --- Mandatory H.264 re-encode so the file actually plays in a browser ---
    try:
        result = subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-i",
                raw_path,
                "-vf",
                "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                final_path,
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as e:
        stderr_tail = (e.stderr or b"").decode(errors="replace")[-2000:]
        raise Exception(
            f"ffmpeg conversion failed for {raw_path} "
            f"(exit code {e.returncode}):\n{stderr_tail}"
        )
    finally:
        # Clean up the raw mp4v intermediate file so it never lingers
        # alongside the final file (this is what used to cause duplicate /
        # mismatched files in processed_videos).
        if os.path.exists(raw_path):
            os.remove(raw_path)
 
    if not os.path.exists(final_path):
        raise Exception(f"Processed video was not created.\nExpected:\n{final_path}")
 
    average_visibility = 0
    if visibility_scores:
        average_visibility = round(sum(visibility_scores) / len(visibility_scores), 2)

    # Write out the flagged "problem moment" frames collected during the
    # loop above, worst first. Saved into the SAME output_folder as the
    # processed video (already served by the existing /processed-videos/
    # route in routers/report.py) - no new static route or DB column
    # needed, this just adds more files to a folder that's already public.
    flagged_frames = []
    flagged_sorted = sorted(flagged_heap, key=lambda e: e[0], reverse=True)
    for rank, (severity, _tiebreak, frame_index, issue_label, detail, jpeg_bytes) in enumerate(flagged_sorted, start=1):
        issue_slug = re.sub(r"[^A-Za-z0-9]+", "_", issue_label).strip("_").lower()
        flagged_filename = f"flagged_{input_stem}_{rank}_{issue_slug}.jpg"
        flagged_path = os.path.abspath(os.path.join(output_folder, flagged_filename))
        with open(flagged_path, "wb") as f:
            f.write(jpeg_bytes)
        timestamp_seconds = round(frame_index / fps, 1) if fps else None
        flagged_frames.append({
            "filename": flagged_filename,
            "issue": issue_label,
            "detail": detail,
            "severity": severity,
            "frame_index": frame_index,
            "timestamp_seconds": timestamp_seconds,
        })

    # NEW. Write out the "movement phase" reference frames - same folder,
    # same public route, one file per evenly-spaced instant across the clip.
    movement_phase_frames = []
    for phase in phase_frames_raw:
        phase_filename = f"phase_{input_stem}_{phase['phase_number']}.jpg"
        phase_path = os.path.abspath(os.path.join(output_folder, phase_filename))
        with open(phase_path, "wb") as f:
            f.write(phase["jpeg_bytes"])
        movement_phase_frames.append({
            "filename": phase_filename,
            "phase_number": phase["phase_number"],
            "issue": phase["issue"],
            "detail": phase["detail"],
            "frame_index": phase["frame_index"],
            "timestamp_seconds": phase["timestamp_seconds"],
        })

    return {
        "processed_video": final_path,
        "total_frames": total_frames,
        "detected_frames": detected_frames,
        "detection_rate": round((detected_frames / total_frames) * 100, 2)
        if total_frames
        else 0,
        "average_visibility": average_visibility,
        "joints": {k: v.to_dict() for k, v in latest_joints.items()} if latest_joints else {},
        "all_joints": all_joints,
        "flagged_frames": flagged_frames,
        "movement_phase_frames": movement_phase_frames,
    }
 
 
# ---------------------------------------------------------
# Get Video Information
# ---------------------------------------------------------
 
def get_video_information(video_path):
    cap = cv2.VideoCapture(video_path)
    info = {
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
    }
    cap.release()
    return info
 
 
# ---------------------------------------------------------
# Save First Frame
# ---------------------------------------------------------
 
def save_thumbnail(video_path, output_folder="processed_videos"):
    os.makedirs(output_folder, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    success, frame = cap.read()
    if not success:
        cap.release()
        return None
    thumbnail_path = os.path.join(output_folder, "thumbnail.jpg")
    cv2.imwrite(thumbnail_path, frame)
    cap.release()
    return thumbnail_path