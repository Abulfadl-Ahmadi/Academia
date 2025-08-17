#!/bin/bash
set -e

PROJECT_DIR=/var/www/myproject
BACKEND_DIR=$PROJECT_DIR
FRONTEND_DIR=$PROJECT_DIR/vite-project
VENV_DIR=$BACKEND_DIR/venv

echo ">>> Pulling latest code..."
cd $PROJECT_DIR
git reset --hard
git pull origin development

echo ">>> Updating backend (Django)..."
cd $BACKEND_DIR
source $VENV_DIR/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput

echo ">>> Restarting backend services..."
systemctl restart gunicorn
systemctl restart nginx

echo ">>> Updating frontend (Vite)..."
cd $FRONTEND_DIR
systemctl restart vite-dev

echo ">>> Deployment finished successfully."
