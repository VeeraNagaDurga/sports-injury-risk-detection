# 🏃 Sports Injury Risk Detection from Video

An AI-powered web application that analyzes athlete movement from uploaded sports videos to detect injury risks using computer vision, pose estimation, and biomechanics analysis.

---

## 📌 Project Overview

Sports injuries are one of the major challenges faced by athletes across different sports. This project aims to assist athletes, coaches, physiotherapists, and sports scientists by providing an AI-based platform that analyzes body posture and movement patterns from uploaded videos to identify potential injury risks before they become severe.

The application combines **React**, **FastAPI**, **OpenCV**, and **MediaPipe Pose Estimation** to build a complete sports injury risk detection system.

---

## 🎯 Objectives

- Detect athlete body posture from uploaded videos.
- Perform human pose estimation using AI.
- Track body joint movements.
- Analyze biomechanics and movement patterns.
- Build athlete profile management.
- Provide injury risk analysis and recommendations.
- Create a scalable web platform for sports analytics.

---

## ✨ Milestone 1 Features

### ✅ Project Initialization
- Project setup
- Frontend and backend configuration
- GitHub repository management

### ✅ Authentication System
- User Registration
- User Login
- Role-based user interface

### ✅ Athlete Profile Management
- Athlete Information
- Sport Type
- Playing Position
- Age
- Height
- Weight
- Injury History
- Training Load

### ✅ Video Upload System
- Video Upload API
- Video Validation
- Video Processing
- Frame Extraction
- Pose Detection Integration

### ✅ Pose Estimation
- MediaPipe Pose Integration
- Human Landmark Detection
- Joint Tracking

### ✅ Dataset Preparation
- Human3.6M
- MPII Human Pose
- COCO Keypoints
- SportsPose
- FIFA Injury Dataset (Reference)

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
- OpenCV
- MediaPipe
- Pydantic

## Tools
- Git
- GitHub
- VS Code

---

# 📁 Project Structure

```
sports-injury-risk-detection
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── utils
│   ├── uploads
│   ├── main.py
│   └── requirements.txt
│
├── datasets
│   ├── Human3.6M
│   ├── MPII
│   ├── COCO
│   ├── SportsPose
│   └── FIFA_Injury
│
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

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python -m uvicorn main:app --reload
```

Backend runs on

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

Frontend runs on

```
http://localhost:3000
```

---

# 📊 Current Progress

| Module | Status |
|---------|--------|
| Project Initialization | ✅ Completed |
| Frontend Setup | ✅ Completed |
| Backend Setup | ✅ Completed |
| Authentication | ✅ Completed |
| Athlete Profile | ✅ Completed |
| Video Upload | ✅ Completed |
| Pose Detection | ✅ Completed |
| Dataset Preparation | ✅ Completed |

---

# 🚀 Future Enhancements

- Joint Angle Calculation
- Injury Risk Prediction
- AI-Based Recommendation System
- Performance Analytics Dashboard
- Real-Time Pose Estimation
- Deep Learning Injury Prediction Models
- Coach Dashboard
- Physiotherapist Dashboard
- Sports Scientist Dashboard

---

# 👩‍💻 Developed By

**Sreeja Maganuru**

B.Tech – Computer Science and Engineering (AI & ML)

CMR College of Engineering & Technology

---

## ⭐ Project Status

**Milestone 1 – Completed**

This repository contains the implementation of Milestone 1 for the **Sports Injury Risk Detection from Video** project. Future milestones will include advanced pose analysis, biomechanics, injury prediction, and AI-powered analytics.
