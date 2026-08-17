🏃 Sports Injury Risk Detection from Video

An AI-powered web application that analyzes athlete movement from
uploaded sports videos to detect potential injury risks using Computer
Vision, Pose Estimation, Biomechanics Analysis, and
Artificial Intelligence.

📌 Project Overview

Sports injuries are one of the major challenges faced by athletes across
different sports. This project assists athletes, coaches,
physiotherapists, and sports scientists by providing an AI-powered
platform that analyzes body posture and movement patterns from uploaded
sports videos to identify potential injury risks before they become
severe.

The application combines React, FastAPI, OpenCV,
MediaPipe, PostgreSQL, and Google Gemini AI to provide
automated biomechanics analysis, pose tracking, injury risk prediction,
processed skeleton videos, downloadable reports, asynchronous AI video
processing, secure access control, and an AI-powered chat assistant.

The system also supports containerized deployment using Docker and
Docker Compose.

🎯 Objectives

Detect athlete body posture from uploaded sports videos.

Perform AI-based pose estimation.

Track body joint movements.

Analyze biomechanics and movement quality.

Predict potential injury risks.

Generate downloadable injury assessment reports.

Manage athlete profiles securely.

Store analysis history in PostgreSQL.

Provide role-based access to athlete data.

Allow controlled athlete data sharing.

Provide an AI-powered chat assistant for authorized analysis data.

Support Google authentication.

Containerize the complete application using Docker.

Build a scalable sports injury intelligence platform.

🚀 Milestone 1 Features

✅ Project Initialization

Project setup

GitHub repository

Frontend & Backend configuration

✅ Authentication System

User Registration

User Login

JWT Authentication

Forgot Password via Email OTP

Password Hashing

✅ Athlete Profile Management

Athlete Information

Sport Type

Playing Position

Age

Height

Weight

Injury History

Training Load

✅ Video Upload

Video Upload API

Video Validation

Video Processing

Frame Extraction

✅ Pose Estimation

MediaPipe Pose Integration

Human Landmark Detection

Joint Tracking

✅ Dataset Preparation

Human3.6M

MPII Human Pose

COCO Keypoints

SportsPose

FIFA Injury Dataset (Reference)

🚀 Milestone 2 Features

✅ Skeleton Tracking

Frame-by-frame pose landmark extraction

Skeleton overlay generation

Browser-compatible processed videos

✅ Biomechanics Analysis

Joint Angle Calculation

Movement Quality Assessment

Biomechanical Deviation Analysis

✅ Injury Risk Prediction

Overall Risk Score

Risk Categorization

Weighted Risk Factors

Movement Asymmetry Detection

✅ Video Analysis

Process Uploaded Videos

Skeleton Video Generation

Detection Rate Calculation

✅ Injury Report Generation

Athlete Assessment

Injury Probability

Corrective Recommendations

PDF Report Generation

✅ Frontend Enhancements

Dashboard

Athlete Profile

Upload Workflow

Results Visualization

Processed Video Playback

🚀 Milestone 3 Features

✅ PostgreSQL Database Integration

PostgreSQL Database

SQLAlchemy ORM

Persistent Storage

Users

Athlete Profiles

Videos

Analysis Results

Reports

✅ User Authentication & Security

JWT Authentication

Role-Based Authentication

Forgot Password via Email OTP

Secure Password Hashing

Protected API Endpoints

✅ Asynchronous AI Video Processing

FastAPI BackgroundTasks

Non-blocking Upload Workflow

Background AI Processing

Analysis Status Tracking

Automatic Result Retrieval

✅ AI Injury Intelligence Pipeline

Pose Estimation

Skeleton Tracking

Biomechanics Analysis

Movement Quality Analysis

Injury Risk Prediction

Risk Scoring

Corrective Recommendations

PDF Report Generation

✅ Modular Backend Architecture

Service-Based Architecture

Router-Based API Design

CRUD Layer

Database Abstraction

Separation of Concerns

✅ Database Storage

Uploaded Videos

Processed Skeleton Videos

Analysis Results

Injury Recommendations

Reports

Analysis History

✅ Dashboard Improvements

Dashboard Statistics

Analysis History

Processed Video Viewing

Report Downloads

Database-Driven Information

🚀 Milestone 4 Features

✅ AI Chat Assistant

The project includes an AI-powered chat assistant using Google Gemini
3.6 Flash.

Features

Natural-language AI chat interface

Gemini 3.6 Flash integration

Context-aware responses

Questions about the user's own analysis data

Questions about analysis data shared with the user

Risk score explanations

Movement finding explanations

Analysis comparison questions

Recommendation-related questions

AI Data Access

The AI assistant only receives analysis information that the logged-in
user is authorized to access.

The AI does not automatically receive private information belonging to
unrelated users.

Admin Restriction

AI Chat is not available to Admin users.

The restriction is implemented at:

Frontend level

Backend authorization level

Therefore, hiding the chat button alone is not used as the security
mechanism.

✅ Google Authentication

The project supports Google-based authentication in addition to the
existing manual email/password authentication.

Features

Google Sign-Up

Google Login

Google Identity Services

Server-side Google token verification

Existing user login

New Google user registration

Username selection for new Google users

Manual registration and login continue to be supported.

✅ Unique Username System

A unique username has been added as a user-level identifier.

Username Features

Every user has a unique username.

Username uniqueness is validated.

Username is used for identifying users during access requests.

Username is displayed where appropriate in user profiles.

Important Distinction

Athlete ID is NOT replaced.

The system maintains both:

Athlete ID → Athlete profile identification

Username → Unique user identifier used for access requests

Example:

Athlete ID: ATH-001
Username: athlete123

✅ Athlete Access Management

The system supports controlled sharing of athlete information.

Request Access

Users can request access using an athlete's unique username.

Enter Athlete Username
        ↓
Find User
        ↓
Send Access Request
        ↓
Athlete Accepts / Rejects
        ↓
Access Granted After Approval

Access Controls

Request access using username

Invalid username validation

Self-request prevention

Duplicate request prevention

Access request approval

Access request rejection

Protected athlete information

Authorized shared-data access

Access is not automatically granted when a request is created.

✅ Admin Management

The system provides administrative controls for managing platform users.

Admin Features

Admin authentication

User management

View registered users

View user information

Account status management

Account revocation

Admin functionality is protected using role-based authorization.

✅ Dockerization

The complete application has been containerized.

Containers

                 Docker Compose
                      |
          ┌───────────┼───────────┐
          ↓           ↓           ↓
      PostgreSQL    FastAPI     React/Nginx
        :5432        :8000        :3000

Backend Container

Python 3.11

FastAPI

Uvicorn

OpenCV dependencies

MediaPipe dependencies

FFmpeg

Backend health check

Frontend Container

Node.js build environment

React production build

Nginx

Frontend health check

Database Container

PostgreSQL 16 Alpine

Persistent PostgreSQL volume

Database health check

Docker Compose

Docker Compose manages:

Frontend

Backend

PostgreSQL

Service dependencies

Health checks

Persistent database storage

Network configuration

🛠 Technology Stack

Frontend

React.js

React Router

Axios

React Icons

CSS3

Nginx

Backend

FastAPI

Python 3.11

SQLAlchemy

PostgreSQL

Pydantic

Passlib

JWT Authentication

Uvicorn

AI & Computer Vision

Google Gemini API

Gemini 3.6 Flash

OpenCV

MediaPipe Pose

Pose Estimation

Skeleton Tracking

Biomechanics Analysis

Movement Quality Analysis

Injury Risk Engine

Authentication

JWT Authentication

Google Identity Services

Google Authentication

Database

PostgreSQL

SQLAlchemy ORM

Reports

ReportLab

PDF Report Generation

Video Processing

OpenCV

FFmpeg

MediaPipe

Deployment

Docker

Docker Compose

Nginx

PostgreSQL Container

Tools

Git

GitHub

VS Code

Docker Desktop

WSL2

📁 Project Structure

sports-injury-risk-detection
│
├── frontend
│   ├── src
│   │   ├── components
│   │   │   └── ChatWidget.jsx
│   │   ├── styles
│   │   │   └── chat.css
│   │   ├── App.js
│   │   └── ...
│   ├── public
│   ├── Dockerfile
│   ├── nginx.conf
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
│   │   ├── report.py
│   │   ├── chat.py
│   │   └── ...
│   │
│   ├── services
│   │   ├── analysis_service.py
│   │   ├── auth_service.py
│   │   ├── dashboard_service.py
│   │   ├── report_service.py
│   │   ├── video_service.py
│   │   ├── google_auth_service.py
│   │   ├── chat_service.py
│   │   └── ...
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
│   ├── Dockerfile
│   └── requirements.txt
│
├── database
├── datasets
├── docs
├── wireframes
├── .dockerignore
├── docker-compose.yml
└── README.md

🚀 How to Run Locally

Clone Repository

git clone https://github.com/VeeraNagaDurga/sports-injury-risk-detection.git
cd sports-injury-risk-detection

Backend

cd backend
python -m venv venv311

Windows

venv311\Scripts\activate

Install Dependencies

pip install -r requirements.txt

Start Backend

uvicorn main:app --reload --port 8000

Backend:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs

Frontend

Open another terminal:

cd frontend
npm install
npm start

Frontend:

http://localhost:3000

🐳 Run Using Docker

Make sure Docker Desktop is running.

From the project root:

docker compose up --build

Or:

docker compose up -d

Check containers:

docker compose ps

Expected:

PostgreSQL   Up (healthy)
Backend      Up (healthy)
Frontend     Up (healthy)

Frontend:

http://localhost:3000

Backend:

http://localhost:8000

Swagger:

http://localhost:8000/docs

Stop containers:

docker compose down

🔐 Environment Configuration

Sensitive configuration should be stored in environment variables.

Example:

DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key

GOOGLE_CLIENT_ID=your_google_client_id

GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=your_gemini_api_key

Do not commit real API keys, passwords, SMTP credentials, or other
secrets to GitHub.

📊 Current Progress

Module                           Status

Authentication                   ✅ Completed
Manual Registration & Login      ✅ Completed
Forgot Password                  ✅ Completed
Google Authentication            ✅ Completed
Athlete Profile Management       ✅ Completed
Athlete ID                       ✅ Completed
Unique Username                  ✅ Completed
Username-Based Access Requests   ✅ Completed
Access Approval/Rejection        ✅ Completed
PostgreSQL Integration           ✅ Completed
Video Upload                     ✅ Completed
Asynchronous Video Processing    ✅ Completed
Pose Estimation                  ✅ Completed
Skeleton Tracking                ✅ Completed
Biomechanics Analysis            ✅ Completed
Movement Quality Analysis        ✅ Completed
Injury Risk Prediction           ✅ Completed
Risk Scoring                     ✅ Completed
Corrective Recommendations       ✅ Completed
Processed Skeleton Video         ✅ Completed
PDF Report Generation            ✅ Completed
Analysis History                 ✅ Completed
Results Dashboard                ✅ Completed
Notifications                    ✅ Completed
Admin Management                 ✅ Completed
Account Revocation               ✅ Completed
Gemini AI Chat                   ✅ Completed
Admin AI Chat Restriction        ✅ Completed
Docker Backend                   ✅ Completed
Docker Frontend                  ✅ Completed
PostgreSQL Docker Container      ✅ Completed
Docker Compose                   ✅ Completed

🔄 Complete System Workflow

                    USER
                     |
          ┌──────────┴──────────┐
          ↓                     ↓
    Manual Login          Google Login
          |                     |
          └──────────┬──────────┘
                     ↓
              Authentication
                     ↓
                Dashboard
                     |
          ┌──────────┼──────────┐
          ↓          ↓          ↓
      Profile     Upload      Access
          |        Video       Control
          |          |
          |          ↓
          |    Video Processing
          |          ↓
          |    MediaPipe Pose
          |          ↓
          |   Skeleton Tracking
          |          ↓
          |   Biomechanics
          |          ↓
          |   Risk Analysis
          |          ↓
          |    Risk Score
          |          ↓
          |       Results
          |       /    \
          |      ↓      ↓
          |    PDF     Video
          |
          └──────────────┐
                         ↓
                   AI Chat Assistant
                         ↓
                  Gemini 3.6 Flash
                         ↓
              Authorized Analysis Data

🔒 Security & Access Control

The application uses multiple layers of security.

Authentication

JWT authentication

Password hashing

Protected API endpoints

Google token verification

Authorization

Role-based access

Athlete data protection

Access request approval

Controlled shared-data access

AI Security

AI Chat restricted to authorized users

Users can query their own analysis data

Users can query analysis data explicitly shared with them

Admin users are blocked from AI Chat

Backend validates Admin restrictions

Unauthorized athlete data is not provided as AI context

Secrets

Environment variables are used for sensitive credentials.

.env files should not be committed to GitHub.

📈 Milestone 4 Summary

Milestone 4 extends the existing injury-risk platform with:

AI

Gemini 3.6 Flash AI Chat Assistant

Context-aware analysis conversations

Authentication

Google Login

Google Signup

Existing manual authentication

Collaboration

Unique usernames

Username-based access requests

Approval/rejection workflow

Protected shared athlete data

Administration

Admin management

Account revocation

Role-based controls

Admin AI Chat restriction

Deployment

Dockerized backend

Dockerized frontend

PostgreSQL container

Docker Compose

Health checks

Persistent database storage

🚀 Future Enhancements

Multi-Athlete Comparison

Advanced Performance Analytics

Deep Learning Injury Prediction

Cloud Deployment

Real-Time Pose Estimation

Real-Time Sports Analytics

Advanced Predictive Models

Larger Sports-Specific Datasets

Mobile Application

Advanced Coach and Physiotherapist Analytics

⭐ Project Status

✅ Milestone 4 Completed

The project now contains the implementation of Milestones 1, 2, 3, and
4.

Core Features

✅ User Registration & Login

✅ JWT Authentication

✅ Forgot Password via Email OTP

✅ Google Authentication

✅ Athlete Profile Management

✅ Unique Username

✅ Athlete ID

✅ Username-Based Access Requests

✅ Access Approval/Rejection

✅ PostgreSQL Database Integration

✅ Video Upload & Processing

✅ Asynchronous AI Video Processing

✅ Pose Estimation

✅ Skeleton Tracking

✅ Biomechanics Analysis

✅ Movement Quality Assessment

✅ Injury Risk Prediction

✅ Risk Scoring

✅ Corrective Recommendations

✅ Processed Skeleton Video

✅ Downloadable PDF Reports

✅ Analysis History

✅ Interactive Dashboard

✅ Notifications

✅ Admin Management

✅ Account Revocation

✅ Gemini 3.6 Flash AI Chat

✅ Authorized AI Data Access

✅ Admin AI Chat Restriction

✅ Dockerized Backend

✅ Dockerized Frontend

✅ PostgreSQL Docker Container

✅ Docker Compose

✅ Container Health Checks

👩‍💻 Developed By

Veera Naga Durga Garlanka

B.Tech -- Computer Science & Engineering (AI & ML)

CMR College of Engineering & Technology

Infosys Springboard Internship Program

📄 License

This project was developed as part of the Infosys Springboard
Internship Program for educational and research purposes.
