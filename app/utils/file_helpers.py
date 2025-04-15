from werkzeug.utils import secure_filename
import os
from app.config import ALLOWED_EXTENSIONS, UPLOAD_FOLDER

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file):
    """Save a file to the upload directory and return the filename."""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        return filename
    return None

def get_file_path(filename):
    """Get the full path of a file in the upload directory."""
    return os.path.join(UPLOAD_FOLDER, filename)

def list_files():
    """List all files in the upload directory."""
    return [f for f in os.listdir(UPLOAD_FOLDER) if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))] 