#!/bin/bash
set -e

PROJECT_DIR=/var/www/myproject
BACKEND_DIR=$PROJECT_DIR
FRONTEND_DIR=$PROJECT_DIR/vite-project
VENV_DIR=$BACKEND_DIR/venv

echo ">>> Pulling latest code from main..."
cd $PROJECT_DIR
git fetch origin main
git reset --hard origin/main

echo ">>> Updating backend (Django)..."
cd $BACKEND_DIR
if [ -d "$VENV_DIR" ]; then
    source $VENV_DIR/bin/activate
    pip install -r requirements.txt
    python3 manage.py migrate --noinput
    python3 manage.py collectstatic --noinput
else
    echo "Warning: Virtual environment not found at $VENV_DIR"
fi

echo ">>> Updating frontend (Vite)..."
cd $FRONTEND_DIR
if [ -d "node_modules" ]; then
    npm install
fi
npm run linux-build

echo ">>> Restarting services..."
systemctl restart nginx
systemctl restart myproject

echo ">>> Production deployment finished successfully."
