# ⚡ FocusFlow AI — End-to-End AI/ML Adaptive Learning & Focus Mastery Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688.svg)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn%20Ensembles-orange.svg)](https://scikit-learn.org/)
[![OpenCV](https://img.shields.io/badge/CV-OpenCV%20Proctoring-red.svg)](https://opencv.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**FocusFlow AI** is an advanced multimodal learning platform engineered to rebuild deep sitting focus and combat the attention fragmentation caused by short-form digital media. It pairs intelligent **YouTube subpart slicing and RAG indexing** with **Stacking Ensemble Machine Learning**, **Bayesian Knowledge Tracing (BKT)**, **Computer Vision Anti-Slacking**, a **Real-World Student Rewards Marketplace**, and **Proctored Exams**.

---

## 🌟 Core Architecture & Key Features

### 1. 🎥 YouTube Streamer & Dual-Keyframe Range Slicer
- **Precision Time Interval Slicing**: Select start and end keyframes (e.g. `[12:30 - 28:45]`) within any long lecture.
- **RAG Subpart Doubts & Summaries**: Instant retrieval-grounded explanations, mathematical derivations, and multi-persona AI tutoring for the selected video slice.
- **Adaptive Milestones**: Slices long videos into customized chunks adding **+15m to +30m** beyond the student's baseline focus stamina.

### 2. 🤖 Python AI/ML Core Engines
- **Stacking Ensemble Regressor** (`backend/ml_engine.py`): Combines `RandomForestRegressor`, `GradientBoostingRegressor`, and `Ridge` regression to dynamically predict optimal sitting stretch duration and real-time cognitive fatigue risk.
- **Bayesian Knowledge Tracing (BKT)** (`backend/ml_engine.py`): Tracks latent topic mastery $P(L_t)$, slip, guess, and transition probabilities across sequential practice question attempts.
- **RAG Vector Search** (`backend/rag_engine.py`): Text chunking and TF-IDF / dense vector cosine similarity retrieval across YouTube transcripts, PDFs, and notes.
- **Computer Vision Anti-Slacking Guardian** (`backend/cv_proctor.py`): OpenCV-based face presence, head pose/gaze orientation (detecting looking away), and empty desk detection to pause focus rewards if the student stands up.
- **LLM Multi-Persona Tutoring** (`backend/llm_service.py`): Socratic, Feynman (ELI5), Strict Grader, and Focus Coach dialogue modes with speech-to-text and voice synthesis.

### 3. 📊 Dedicated Student Stats & Growth Analytics Hub
- **Correct vs. Incorrect Questions Breakdown**: Interactive Canvas Donut Chart, topic accuracy progress bars, and a question revision ledger with direct re-attempts.
- **14-Day Watching & Sitting Growth Chart**: Multi-bar/line trajectory tracking watched hours vs. verified sitting stamina expansion.
- **Live Ensemble ML Predictor Card**: Real-time display of sitting stretch recommendations and fatigue indicators.

### 4. 🎁 Real-World Student Rewards Marketplace
Turn earned **Focus Gems 💎** and **Streaks 🔥** into tangible rewards:
- ✈️ **Travel & Commute**: 25% Off Flight & Rail Passes (*MakeMyTrip / StudentUniverse*), $15 Uber Student Ride Credit.
- 🎬 **Cinema & Entertainment**: Free Weekend IMAX 3D Movie Ticket (*AMC / PVR INOX*), 1-Month Spotify & Netflix Pass.
- ☕ **Cafes & Study Fuel**: Free Starbucks Nitro Cold Brew / Latte, 40% Off Artisanal Coffee & Bakery Combos.
- 🛍️ **Shopping & Tech Gear**: $20 Amazon Tech Voucher, 35% Off ANC Noise-Cancelling Headphones.
- 🚀 **AI & Academic Grants**: 1-Month Gemini Advanced & Cloud GPU Compute Credits.
- **Claimed Vouchers Wallet**: Generates unique promo codes with 1-click clipboard copy.

### 5. 🔐 Student Authentication & 1-Click Demo Profiles
- Sign in, register with custom baseline sitting times, or switch seamlessly between pre-configured student accounts:
  - **Alex Rivera** (CS & AI Track • Lvl 3, 6d Streak, 85 Gems)
  - **Maya Patel** (Quant Finance & Deep Learning • Lvl 5, 14d Streak, 160 Gems)
  - **Liam Vance** (Distributed Cloud Architect • Lvl 2, 4d Streak, 45 Gems)

### 6. 🛡️ Additional Advanced Learning Modules
- **Interactive 3D Flashcards**: Leitner spaced repetition system.
- **Concept Mind Map**: Interactive zoomable concept graph.
- **Proctored Exams**: Anti-cheat snapshot monitoring and integrity grading.
- **AI Avatar Interviewer**: Animated lip-syncing 3D avatar for mock technical interviews.
- **Collaborative Study Groups**: 8–10 peer study mesh with live simulated voice calls.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, Scikit-Learn, NumPy, SciPy, OpenCV (`opencv-python`), Google GenAI SDK
- **Frontend**: Vanilla JavaScript (ES6+ Modules), HTML5 Canvas, Cyberpunk Glassmorphic CSS Design System
- **State Management**: LocalStorage persistence with REST API synchronization

---

## 🚀 Deployment on Render / Cloud

FocusFlow AI is optimized for 1-click cloud deployment on **Render**:

### Render Web Service Configuration:
- **Environment**: `Python`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT` (or `python main.py`)
- **Main Entrypoint**: `main.py` (Exposes `app` directly at root)

Alternatively, connect your repository to Render using the included `render.yaml` Blueprint!

---

## 💻 Local Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/jayank1824/Focus-Flow-AI.git
cd Focus-Flow-AI
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch the Server
```bash
python main.py
```
*(or `python server.py`)*

Open your browser and navigate to:
```
http://localhost:8080
```

---

## 📁 Repository Structure

```
Focus-Flow-AI/
├── backend/
│   ├── app_server.py      # FastAPI REST server & API routes
│   ├── ml_engine.py       # Stacking Ensemble focus model & BKT knowledge tracing
│   ├── rag_engine.py      # Vector cosine similarity search & text chunking
│   ├── cv_proctor.py      # OpenCV presence, gaze, and empty desk detection
│   └── llm_service.py     # Generative tutoring & dynamic question synthesis
├── js/
│   ├── app.js             # Master UI coordinator & routing
│   ├── auth.js            # Authentication, sessions & demo accounts
│   ├── rewardsStore.js    # Rewards marketplace & claimed vouchers wallet
│   ├── analytics.js       # Stats hub, donut charts & growth curves
│   ├── youtubePlayer.js   # Dual-keyframe range slicer & streamer
│   ├── focusEngine.js     # Adaptive focus sprint timers & HUD
│   ├── webcamProctor.js   # Client webcam feed & posture proctoring
│   ├── practiceHub.js     # Question banks & BKT mastery sync
│   ├── examProctor.js     # Proctored testing suite
│   ├── avatarInterviewer.js # 3D animated avatar interviewer
│   ├── mindmap.js         # Interactive concept tree
│   ├── flashcards.js      # 3D flip Leitner flashcards
│   ├── studyGroups.js     # 8-10 peer study rooms
│   ├── knowledgeHub.js    # RAG resource ingestion
│   └── storage.js         # Client-side data store
├── styles/
│   ├── main.css           # Glassmorphism design tokens & typography
│   └── components.css     # Component styling & layouts
├── index.html             # Master application shell
├── server.py              # Server launcher
├── .gitignore
└── README.md
```

---

## 📄 License
This project is licensed under the MIT License.
