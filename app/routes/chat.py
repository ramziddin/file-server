from flask import Blueprint, request, jsonify, Response, stream_with_context, json
from app.utils.chat_helpers import chat_manager
import time

bp = Blueprint('chat', __name__, url_prefix='/chat')

@bp.route('/send', methods=['POST'])
def send_message():
    """Handle sending a new message."""
    message_data = request.json
    username = message_data.get('username', 'Anonymous')
    text = message_data.get('text', '')
    
    if not text.strip():
        return jsonify({'error': 'Empty message'}), 400
    
    # Log the message length for debugging
    print(f"Received message from {username} with length {len(text)}")
    
    success = chat_manager.add_message(username, text)
    return jsonify({'success': success})

@bp.route('/messages', methods=['GET'])
def get_messages():
    """Get all chat messages."""
    return jsonify(chat_manager.get_messages())

@bp.route('/poll', methods=['GET'])
def poll_messages():
    """Long-polling endpoint for chat messages."""
    # Get the last message ID from the client
    last_id = request.args.get('last_id', '0')
    last_id = int(last_id)
    
    # Get the current message count
    current_count = len(chat_manager.get_messages())
    
    # If there are new messages, return them immediately
    if current_count > last_id:
        return jsonify(chat_manager.get_messages())
    
    # Otherwise, wait for new messages (with a timeout)
    timeout = 30  # seconds
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        # Check if there are new messages
        if len(chat_manager.get_messages()) > current_count:
            return jsonify(chat_manager.get_messages())
        
        # Sleep for a short time to avoid busy waiting
        time.sleep(0.5)
    
    # If we timed out, return an empty response
    return jsonify([])

@bp.route('/stream')
def stream():
    """SSE endpoint for streaming chat messages."""
    def generate():
        client_queue = chat_manager.add_client()
        try:
            # Send initial messages
            messages = chat_manager.get_messages()
            if messages:
                # Log the message count for debugging
                print(f"Sending {len(messages)} initial messages to client")
                yield f"data: {json.dumps(messages)}\n\n"
            
            while True:
                message = client_queue.get()
                if message:
                    # Log the message length for debugging
                    print(f"Sending message with length {len(message['text'])} to client")
                    yield f"data: {json.dumps(message)}\n\n"
        finally:
            chat_manager.remove_client(client_queue)

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'  # Disable buffering for nginx
        }
    ) 