#!/usr/bin/env bash
# Loom setup for Linux/macOS (Git Bash on Windows: prefer setup.ps1).
set -e
npm install --no-audit --no-fund
python3 -m pip install -r requirements.txt
python3 -m loom setup voice
npx hyperframes browser ensure
python3 -m loom catalog
python3 -m loom doctor
