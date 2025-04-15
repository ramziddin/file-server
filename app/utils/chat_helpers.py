from datetime import datetime
from app.config import MAX_MESSAGES

class ChatManager:
    def __init__(self):
        self.messages = []

    def add_message(self, username, text):
        """Add a new message to the chat."""
        if not text.strip():
            return False
            
        message = {
            'username': username or 'Anonymous',
            'text': text,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        }
        
        self.messages.append(message)
        
        # Keep only the last MAX_MESSAGES messages
        while len(self.messages) > MAX_MESSAGES:
            self.messages.pop(0)
            
        return True

    def get_messages(self):
        """Get all messages."""
        return self.messages

# Create a single instance to be used across the application
chat_manager = ChatManager() 