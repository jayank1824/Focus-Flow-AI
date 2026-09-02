#!/usr/bin/env python3
"""
FocusFlow AI - Primary Server Launcher
Runs the complete FastAPI AI/ML backend and serves static frontend assets.
"""

import os
import sys

# Ensure current directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

def main():
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")

    print("=" * 65)
    print(f"[FocusFlow AI] Starting Python AI/ML Platform...")
    print(f"[FocusFlow AI] URL: http://localhost:{port}")
    print(f"[FocusFlow AI] Workspace: {CURRENT_DIR}")
    print("=" * 65)

    uvicorn.run(
        "backend.app_server:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()
