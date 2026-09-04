#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
cd /workspace/app
pip install --break-system-packages -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 1337 --reload
