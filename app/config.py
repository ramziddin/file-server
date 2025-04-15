import os

# Base directory of the application
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

# Upload configuration
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip'}

# Chat configuration
MAX_MESSAGES = 100

# Flask configuration
DEBUG = True
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change-in-production')

# Create required directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 