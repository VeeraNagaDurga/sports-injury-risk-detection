# Sports Injury Risk Detection

Quick local run instructions.

Backend
- create a Python venv and activate it

```powershell
python -m venv .venv
& .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend

```bash
cd frontend
npm install
npm start
```

Notes
- If you add large model or media files, use Git LFS or document a download step.
- To reproduce the backend environment exactly, consider using the provided `backend/Dockerfile`.
# AI-Based Sports Injury Risk Detection from Video

## Project Overview
This project aims to develop an AI-powered platform that analyzes athlete movement videos to detect biomechanical issues, identify abnormal movement patterns, predict injury risks, and provide corrective posture recommendations.

## Objectives
- Analyze sports videos using AI.
- Detect human body keypoints.
- Perform biomechanical analysis.
- Predict injury risks.
- Recommend corrective posture and exercises.
- Improve athlete performance and reduce injuries.

## Project Workflow
1. User Registration & Login
2. Upload Sports Video
3. Video Processing (OpenCV)
4. Frame Extraction
5. Pose Estimation (MediaPipe/OpenPose)
6. Biomechanical Analysis
7. Injury Risk Prediction
8. Corrective Recommendations
9. Dashboard & Reports

## Tech Stack

### Frontend
- React.js
- JavaScript
- HTML
- CSS
- Tailwind CSS

### Backend
- Python
- FastAPI

### Database
- PostgreSQL
- MongoDB

### AI & Machine Learning
- OpenCV
- MediaPipe
- TensorFlow
- PyTorch
- YOLOv8

## Milestone 1
- Project initialization
- System architecture
- UI wireframes
- Frontend & Backend setup
- Authentication setup
- Athlete profile management
- Dataset collection

## Team
Infosys Internship Project
