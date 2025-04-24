from datetime import datetime
from app.config import MAX_MESSAGES
from queue import Queue

class ChatManager:
    def __init__(self):
        self.messages = []
        self.clients = set()

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
            
        # Notify all clients about the new message
        self._notify_clients(message)
        return True

    def get_messages(self):
        """Get all messages."""
        return self.messages

    def add_client(self):
        """Add a new client queue."""
        queue = Queue()
        self.clients.add(queue)
        return queue

    def remove_client(self, queue):
        """Remove a client queue."""
        self.clients.discard(queue)

    def _notify_clients(self, message):
        """Notify all clients about a new message."""
        dead_clients = set()
        for client_queue in self.clients:
            try:
                client_queue.put_nowait(message)
            except:
                dead_clients.add(client_queue)
        
        # Remove dead clients
        for dead_client in dead_clients:
            self.remove_client(dead_client)

# Create a single instance to be used across the application
chat_manager = ChatManager() 