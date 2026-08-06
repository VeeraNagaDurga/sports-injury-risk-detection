# 🏃 Sports Injury Risk Detection from Video

An AI-powered web application that analyzes athlete movement from uploaded sports videos to detect potential injury risks using **Computer Vision**, **Pose Estimation**, **Biomechanics Analysis**, and **Artificial Intelligence**.

---

# 📌 Project Overview

Sports injuries are one of the major challenges faced by athletes across different sports. This project assists athletes, coaches, physiotherapists, and sports scientists by providing an AI-powered platform that analyzes body posture and movement patterns from uploaded sports videos to identify potential injury risks before they become severe.

The application combines **React**, **FastAPI**, **OpenCV**, **MediaPipe**, and **PostgreSQL** to provide automated biomechanics analysis, pose tracking, injury risk prediction, processed skeleton videos, downloadable reports, and asynchronous AI video processing.

---

# 🎯 Objectives

- Detect athlete body posture from uploaded sports videos.
- Perform AI-based pose estimation.
- Track body joint movements.
- Analyze biomechanics and movement quality.
- Predict potential injury risks.
- Generate downloadable injury assessment reports.
- Manage athlete profiles securely.
- Store analysis history in PostgreSQL.
- Build a scalable sports injury intelligence platform.

---

# 🚀 Milestone 1 Features

## ✅ Project Initialization

- Project setup
- GitHub repository
- Frontend & Backend configuration

## ✅ Authentication System

- User Registration
- User Login
- JWT Authentication
- Forgot Password via Email OTP
- Password Hashing

## ✅ Athlete Profile Management

- Athlete Information
- Sport Type
- Playing Position
- Age
- Height
- Weight
- Injury History
- Training Load

## ✅ Video Upload

- Video Upload API
- Video Validation
- Video Processing
- Frame Extraction

## ✅ Pose Estimation

- MediaPipe Pose Integration
- Human Landmark Detection
- Joint Tracking

## ✅ Dataset Preparation

- Human3.6M
- MPII Human Pose
- COCO Keypoints
- SportsPose
- FIFA Injury Dataset (Reference)

---

# 🚀 Milestone 2 Features

## ✅ Skeleton Tracking

- Frame-by-frame pose landmark extraction
- Skeleton overlay generation
- Browser-compatible processed videos

## ✅ Biomechanics Analysis

- Joint Angle Calculation
- Movement Quality Assessment
- Biomechanical Deviation Analysis

## ✅ Injury Risk Prediction

- Overall Risk Score
- Risk Categorization
- Weighted Risk Factors
- Movement Asymmetry Detection

## ✅ Video Analysis

- Process Uploaded Videos
- Skeleton Video Generation
- Detection Rate Calculation

## ✅ Injury Report Generation

- Athlete Assessment
- Injury Probability
- Corrective Recommendations
- PDF Report Generation

## ✅ Frontend Enhancements

- Dashboard
- Athlete Profile
- Upload Workflow
- Results Visualization
- Processed Video Playback

---

# 🚀 Milestone 3 Features

## ✅ PostgreSQL Database Integration

- PostgreSQL Database
- SQLAlchemy ORM
- Persistent Storage
- Users
- Athlete Profiles
- Videos
- Analysis Results
- Reports

## ✅ User Authentication & Security

- JWT Authentication
- Role-Based Authentication
- Forgot Password via Email OTP
- Secure Password Hashing
- Protected API Endpoints

## ✅ Asynchronous AI Video Processing

- FastAPI BackgroundTasks
- Non-blocking Upload Workflow
- Background AI Processing
- Analysis Status Tracking
- Automatic Result Retrieval

## ✅ AI Injury Intelligence Pipeline

- Pose Estimation
- Skeleton Tracking
- Biomechanics Analysis
- Movement Quality Analysis
- Injury Risk Prediction
- Risk Scoring
- Corrective Recommendations
- PDF Report Generation

## ✅ Modular Backend Architecture

- Service-Based Architecture
- Router-Based API Design
- CRUD Layer
- Database Abstraction
- Separation of Concerns

## ✅ Database Storage

- Uploaded Videos
- Processed Skeleton Videos
- Analysis Results
- Injury Recommendations
- Reports
- Analysis History

## ✅ Dashboard Improvements

- Dashboard Statistics
- Analysis History
- Processed Video Viewing
- Report Downloads
- Database-Driven Information

---

# 🛠 Technology Stack

## Frontend

- React.js
- React Router
- Axios
- React Icons
- CSS3

## Backend

- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- Pydantic
- Passlib
- JWT Authentication

## AI & Computer Vision

- OpenCV
- MediaPipe Pose
- Pose Estimation
- Skeleton Tracking
- Biomechanics Analysis
- Injury Risk Engine

## Database

- PostgreSQL
- SQLAlchemy ORM

## Tools

- Git
- GitHub
- VS Code

---

# 📁 Project Structure

```text
sports-injury-risk-detection
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── database
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── crud.py
│   │
│   ├── routers
│   │   ├── auth.py
│   │   ├── athlete.py
│   │   ├── upload.py
│   │   ├── analysis.py
│   │   └── report.py
│   │
│   ├── services
│   │   ├── analysis_service.py
│   │   ├── auth_service.py
│   │   ├── dashboard_service.py
│   │   ├── report_service.py
│   │   └── video_service.py
│   │
│   ├── utils
│   │   ├── biomechanics.py
│   │   ├── injury_risk_engine.py
│   │   ├── movement_quality.py
│   │   ├── pose_estimation.py
│   │   ├── report_generator.py
│   │   └── skeleton_tracking.py
│   │
│   ├── uploads
│   ├── processed_videos
│   ├── reports
│   ├── main.py
│   └── requirements.txt
│
├── database
├── datasets
├── docs
├── wireframes
└── README.md
```

---

# 🚀 How to Run

## Clone Repository

```bash
git clone https://github.com/VeeraNagaDurga/sports-injury-risk-detection.git
```

---

## Backend

```bash
cd backend

python -m venv venv311

venv311\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm start
```

Frontend:

```
http://localhost:3000
```

---

# 📊 Current Progress

| Module | Status |
|----------|--------|
| Authentication | ✅ Completed |
| Forgot Password | ✅ Completed |
| Athlete Profile Management | ✅ Completed |
| PostgreSQL Integration | ✅ Completed |
| Video Upload | ✅ Completed |
| Asynchronous Video Processing | ✅ Completed |
| Pose Estimation | ✅ Completed |
| Skeleton Tracking | ✅ Completed |
| Biomechanics Analysis | ✅ Completed |
| Movement Quality Analysis | ✅ Completed |
| Injury Risk Prediction | ✅ Completed |
| Risk Scoring | ✅ Completed |
| Corrective Recommendations | ✅ Completed |
| Processed Skeleton Video | ✅ Completed |
| PDF Report Generation | ✅ Completed |
| Analysis History | ✅ Completed |
| Results Dashboard | ✅ Completed |

---

# 🚀 Future Enhancements (Milestone 4)

- Admin Analytics Dashboard
- Coach Dashboard
- Physiotherapist Dashboard
- Sports Scientist Dashboard
- Athlete-Coach Access Management
- Multi-Athlete Comparison
- Performance Analytics
- Deep Learning Injury Prediction
- Cloud Deployment
- Real-Time Pose Estimation

---

# 👩‍💻 Developed By

**Veera Naga Durga Garlanka**

B.Tech – Computer Science & Engineering (AI & ML)

CMR College of Engineering & Technology

Infosys Springboard Internship Program

---

# ⭐ Project Status

## ✅ Milestone 3 Completed

This repository contains the implementation of **Milestone 1**, **Milestone 2**, and **Milestone 3** of the **Sports Injury Risk Detection from Video** project.

### Implemented Features

- ✅ User Registration & Login
- ✅ JWT Authentication
- ✅ Forgot Password (Email OTP)
- ✅ Athlete Profile Management
- ✅ PostgreSQL Database Integration
- ✅ Video Upload & Processing
- ✅ Asynchronous AI Video Processing
- ✅ Pose Estimation
- ✅ Skeleton Tracking
- ✅ Biomechanics Analysis
- ✅ Movement Quality Assessment
- ✅ Injury Risk Prediction
- ✅ Risk Scoring
- ✅ Corrective Recommendations
- ✅ Processed Skeleton Video Generation
- ✅ Downloadable PDF Reports
- ✅ Analysis History
- ✅ Interactive Dashboard
- ✅ Modular FastAPI Backend Architecture

The next milestone will focus on **Admin Analytics Dashboard**, **Role-Based Collaboration**, **Advanced AI Models**, **Cloud Deployment**, and **Real-Time Sports Analytics**.

---

# 📄 License

This project was developed as part of the **Infosys Springboard Internship Program** for educational and research purposes.
