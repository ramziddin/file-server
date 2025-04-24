// Function to update chat box with messages
function updateChatBox(messages) {
    const chatBox = document.getElementById('chatBox');
    
    // If messages is a string (from SSE), parse it
    if (typeof messages === 'string') {
        try {
            messages = JSON.parse(messages);
        } catch (e) {
            console.error('Error parsing JSON:', e, messages);
            return; // Skip processing if JSON is invalid
        }
    }
    
    // For single message updates (from SSE)
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        // Create message content span for easy copying
        const messageContent = msg.text;
        
        // Create elements instead of using innerHTML to better handle content
        const userSpan = document.createElement('span');
        userSpan.className = 'user';
        userSpan.textContent = `${msg.username}:`;
        
        const msgContentSpan = document.createElement('span');
        msgContentSpan.className = 'msg-content';
        // Replace newlines with <br> and preserve tabs/spaces
        msgContentSpan.innerHTML = messageContent
            .replace(/\n/g, '<br>')
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/ {2}/g, '&nbsp;&nbsp;');
        // Apply CSS to preserve whitespace
        msgContentSpan.style.whiteSpace = 'pre-wrap';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'time';
        timeSpan.textContent = msg.timestamp;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = function() { copyMessage(this); };
        copyBtn.setAttribute('data-message', encodeURIComponent(messageContent));
        
        messageDiv.appendChild(userSpan);
        messageDiv.appendChild(document.createTextNode(' '));
        messageDiv.appendChild(msgContentSpan);
        messageDiv.appendChild(document.createTextNode(' '));
        messageDiv.appendChild(timeSpan);
        messageDiv.appendChild(document.createTextNode(' '));
        messageDiv.appendChild(copyBtn);
        
        chatBox.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
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
    const message = messageInput.value;  // Don't trim to preserve leading/trailing whitespace
    
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
    })
    .catch(error => console.error('Error sending message:', error));
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Clear chat box
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';
    
    // Set up SSE connection
    const eventSource = new EventSource('/chat/stream');
    
    eventSource.onmessage = (event) => {
        console.log('Received SSE data:', event.data);
        updateChatBox(event.data);
    };
    
    eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        // Try to reconnect after 5 seconds
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    };
    
    // Send button click handler
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    
    // Enter key handler - properly handling multiline input
    document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (e.ctrlKey || e.shiftKey) {
                sendMessage();
                e.preventDefault(); // Prevent the default action (new line)
            }
            // Allow normal Enter key behavior for new lines when Ctrl/Shift is not pressed
        }
    });
}); 