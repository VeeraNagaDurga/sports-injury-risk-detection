FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# NEW. opencv-python and mediapipe both need these native shared libraries
# at import time - without them the container builds successfully but
# crashes on startup with something like "ImportError: libGL.so.1: cannot
# open shared object file". ffmpeg is included since this project's own
# code (Results.js) expects it for browser-compatible video encoding.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend/ .

RUN mkdir -p uploads processed_videos reports

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]