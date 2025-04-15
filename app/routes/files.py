from flask import Blueprint, request, send_file, render_template
from app.utils.file_helpers import save_file, get_file_path, list_files

bp = Blueprint('files', __name__)

@bp.route('/')
def index():
    """Render the main page with the list of files."""
    files = list_files()
    return render_template('index.html', files=files)

@bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload."""
    if 'file' not in request.files:
        return {'error': 'No file part'}, 400
        
    file = request.files['file']
    if file.filename == '':
        return {'error': 'No selected file'}, 400
        
    filename = save_file(file)
    if filename is None:
        return {'error': 'File type not allowed'}, 400
        
    return {'message': 'File uploaded successfully', 'filename': filename} 