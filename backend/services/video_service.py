import logging
import os
from pathlib import Path

logger = logging.getLogger("uvicorn.error")

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
PROCESSED_DIR = Path(__file__).parent.parent / "processed_videos"


def delete_video_files(video) -> None:
    """
    Removes the original uploaded file and the processed (skeleton-overlay)
    video from disk for a given Video ORM row. Safe to call even if one or
    both files are already gone, AND safe to call even if a file is
    currently locked by another process (e.g. Windows keeps a lock on a
    video file while it's open/streaming in a browser tab) - in that case
    the DB row is still deleted so the user isn't stuck, and the leftover
    file can be cleaned up manually later.
    """
    if video is None:
        return

    if video.stored_filename:
        upload_path = UPLOAD_DIR / video.stored_filename
        if upload_path.exists():
            try:
                os.remove(upload_path)
            except OSError as e:
                logger.warning(f"Could not delete video file {upload_path}: {e}")

    if video.processed_filename:
        processed_path = PROCESSED_DIR / video.processed_filename
        if processed_path.exists():
            try:
                os.remove(processed_path)
            except OSError as e:
                logger.warning(f"Could not delete processed video file {processed_path}: {e}")