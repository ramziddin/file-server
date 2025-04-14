from flask import Flask, request, send_file, render_template_string, jsonify
import os
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'  # Folder to store uploaded files
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip'}

# Create uploads folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# In-memory storage for chat messages
chat_messages = []

# Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# HTML template for the webpage
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>File Server & Chat</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; }
        .container { display: flex; gap: 20px; }
        .file-section, .chat-section { flex: 1; }
        .chat-box { 
            height: 300px; 
            border: 1px solid #ccc; 
            padding: 10px; 
            overflow-y: scroll;
            margin-bottom: 10px;
            background-color: #f9f9f9;
        }
        .message { margin-bottom: 8px; }
        .message .user { font-weight: bold; }
        .message .time { color: #888; font-size: 0.8em; margin-left: 5px; }
        .chat-input { 
            display: flex; 
            margin-top: 10px;
        }
        .chat-input input[type="text"] { 
            flex: 1; 
            padding: 8px;
            margin-right: 5px;
        }
        .chat-input button {
            padding: 8px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>File Server & Chat</h1>
    
    <div class="container">
        <div class="file-section">
            <h2>Upload File</h2>
            <form method="post" enctype="multipart/form-data" action="/upload">
                <input type="file" name="file">
                <input type="submit" value="Upload">
            </form>
            
            <h2>Available Files</h2>
            <ul>
                {% for file in files %}
                    <li><a href="/download/{{ file }}">{{ file }}</a></li>
                {% endfor %}
            </ul>
        </div>
        
        <div class="chat-section">
            <h2>Chat</h2>
            <div class="chat-box" id="chatBox"></div>
            <div class="chat-input">
                <input type="text" id="username" placeholder="Your Name" style="width: 150px;">
                <input type="text" id="messageInput" placeholder="Type your message...">
                <button id="sendButton">Send</button>
            </div>
        </div>
    </div>

    <script>
        // Function to fetch messages
        function fetchMessages() {
            fetch('/messages')
                .then(response => response.json())
                .then(data => {
                    const chatBox = document.getElementById('chatBox');
                    chatBox.innerHTML = '';
                    
                    data.forEach(msg => {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message';
                        messageDiv.innerHTML = `
                            <span class="user">${msg.username}:</span> 
                            ${msg.text}
                            <span class="time">${msg.timestamp}</span>
                        `;
                        chatBox.appendChild(messageDiv);
                    });
                    
                    // Scroll to bottom
                    chatBox.scrollTop = chatBox.scrollHeight;
                });
        }
        
        // Send message function
        document.getElementById('sendButton').addEventListener('click', function() {
            const messageInput = document.getElementById('messageInput');
            const usernameInput = document.getElementById('username');
            
            if (messageInput.value.trim() === '') return;
            
            const username = usernameInput.value.trim() || 'Anonymous';
            const message = messageInput.value.trim();
            
            fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    text: message
                }),
            })
            .then(response => response.json())
            .then(data => {
                messageInput.value = '';
                fetchMessages();
            });
        });
        
        // Also send message on Enter key
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('sendButton').click();
            }
        });
        
        // Fetch messages initially and every 2 seconds
        fetchMessages();
        setInterval(fetchMessages, 2000);
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    # List all files in the upload folder
    files = os.listdir(UPLOAD_FOLDER)
    return render_template_string(HTML_TEMPLATE, files=files)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        return 'File uploaded successfully! <a href="/">Go back</a>'
    return 'File type not allowed', 400

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return 'File not found', 404

@app.route('/send-message', methods=['POST'])
def send_message():
    message_data = request.json
    username = message_data.get('username', 'Anonymous')
    text = message_data.get('text', '')
    
    if not text.strip():
        return jsonify({'error': 'Empty message'}), 400
    
    timestamp = datetime.now().strftime('%H:%M:%S')
    chat_messages.append({
        'username': username,
        'text': text,
        'timestamp': timestamp
    })
    
    # Keep only the last 100 messages
    while len(chat_messages) > 100:
        chat_messages.pop(0)
        
    return jsonify({'success': True})

@app.route('/messages', methods=['GET'])
def get_messages():
    return jsonify(chat_messages)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)