from flask import Blueprint, request, jsonify
from app.utils.chat_helpers import chat_manager

bp = Blueprint('chat', __name__, url_prefix='/chat')

@bp.route('/send', methods=['POST'])
def send_message():
    """Handle sending a new message."""
    message_data = request.json
    username = message_data.get('username', 'Anonymous')
    text = message_data.get('text', '')
    
    if not text.strip():
        return jsonify({'error': 'Empty message'}), 400
    
    success = chat_manager.add_message(username, text)
    return jsonify({'success': success})

@bp.route('/messages', methods=['GET'])
def get_messages():
    """Get all chat messages."""
    return jsonify(chat_manager.get_messages()) 