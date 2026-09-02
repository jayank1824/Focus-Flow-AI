#!/usr/bin/env python3
"""
FocusFlow AI - Main Render & Cloud Deployment Entrypoint

This file exposes the FastAPI application instance `app` directly at the root level,
allowing seamless 1-click deployment on Render, Railway, Heroku, or local execution.

Deployment Commands on Render:
- Build Command: pip install -r requirements.txt
- Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
  (or simply: python main.py)
"""

import os
import sys

# Ensure root workspace directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Import the main FastAPI application instance from backend.app_server
from backend.app_server import app

if __name__ == "__main__":
    import uvicorn
    # Render and cloud hosts dynamically assign PORT in environment variables
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")

    print("=" * 65)
    print("[FocusFlow AI] Cloud & Local Web Application Server")
    print(f"[FocusFlow AI] Running on http://{host}:{port}")
    print("=" * 65)

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
