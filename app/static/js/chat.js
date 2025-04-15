// Function to fetch messages
function fetchMessages() {
    fetch('/chat/messages')
        .then(response => response.json())
        .then(data => {
            const chatBox = document.getElementById('chatBox');
            chatBox.innerHTML = '';
            
            data.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                
                // Create message content span for easy copying
                const messageContent = msg.text;
                
                messageDiv.innerHTML = `
                    <span class="user">${msg.username}:</span> 
                    <span class="msg-content">${messageContent}</span>
                    <span class="time">${msg.timestamp}</span>
                    <button class="copy-btn" onclick="copyMessage(this)" data-message="${encodeURIComponent(messageContent)}">Copy</button>
                `;
                chatBox.appendChild(messageDiv);
            });
            
            // Scroll to bottom
            chatBox.scrollTop = chatBox.scrollHeight;
        })
        .catch(error => console.error('Error fetching messages:', error));
}

// Function to copy message text to clipboard
function copyMessage(button) {
    const messageText = decodeURIComponent(button.getAttribute('data-message'));
    navigator.clipboard.writeText(messageText)
        .then(() => {
            // Visual feedback
            const originalText = button.textContent;
            button.textContent = "Copied!";
            button.style.backgroundColor = "#4CAF50";
            button.style.color = "white";
            
            // Reset button after 1.5 seconds
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = "";
                button.style.color = "";
            }, 1500);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy to clipboard');
        });
}

// Send message function
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const usernameInput = document.getElementById('username');
    
    if (messageInput.value.trim() === '') return;
    
    const username = usernameInput.value.trim() || 'Anonymous';
    const message = messageInput.value.trim();
    
    fetch('/chat/send', {
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
    })
    .catch(error => console.error('Error sending message:', error));
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Send button click handler
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    
    // Enter key handler
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Fetch messages initially and every 2 seconds
    fetchMessages();
    setInterval(fetchMessages, 2000);
}); 