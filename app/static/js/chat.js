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
        
        // Properly escape HTML and handle special characters
        const escapedContent = messageContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
            
        // Replace newlines with <br> and preserve tabs/spaces
        msgContentSpan.innerHTML = escapedContent
            .replace(/\n/g, '<br>')
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/ {2}/g, '&nbsp;&nbsp;');
            
        // Apply CSS to preserve whitespace
        msgContentSpan.style.whiteSpace = 'pre-wrap';
        msgContentSpan.style.wordBreak = 'break-word';
        
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

// Variables to track connection state
let eventSource = null;
let pollingInterval = null;
let lastMessageCount = 0;

// Function to start SSE connection
function startSSE() {
    // Clear any existing connections
    stopConnection();
    
    // Check if SSE is supported
    if (typeof(EventSource) === "undefined") {
        console.error("SSE is not supported in this browser. Switching to polling.");
        document.getElementById('connection-type').value = 'polling';
        startPolling();
        return;
    }
    
    console.log("Starting SSE connection...");
    
    // Set up SSE connection
    eventSource = new EventSource('/chat/stream');
    
    eventSource.onmessage = (event) => {
        console.log('Received SSE data:', event.data);
        try {
            // Parse the data as JSON
            const data = JSON.parse(event.data);
            console.log('Parsed SSE data:', data);
            updateChatBox(data);
        } catch (error) {
            console.error('Error parsing SSE data:', error, event.data);
        }
    };
    
    eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        // Try to reconnect after 5 seconds
        setTimeout(() => {
            console.log('Attempting to reconnect SSE...');
            startSSE();
        }, 5000);
    };
}

// Function to start long polling
function startPolling() {
    // Clear any existing connections
    stopConnection();
    
    console.log("Starting long polling...");
    
    // Function to poll for new messages
    function poll() {
        fetch(`/chat/poll?last_id=${lastMessageCount}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    console.log('Received polling data:', data);
                    updateChatBox(data);
                    lastMessageCount = data.length;
                }
                // Continue polling
                pollingInterval = setTimeout(poll, 1000);
            })
            .catch(error => {
                console.error('Polling error:', error);
                // Try to reconnect after 5 seconds
                setTimeout(() => {
                    console.log('Attempting to reconnect polling...');
                    startPolling();
                }, 5000);
            });
    }
    
    // Start polling
    poll();
}

// Function to stop any active connection
function stopConnection() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    
    if (pollingInterval) {
        clearTimeout(pollingInterval);
        pollingInterval = null;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Clear chat box
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';
    
    // Connection type selector
    const connectionType = document.getElementById('connection-type');
    
    // Initial connection based on selected type
    if (connectionType.value === 'sse') {
        startSSE();
    } else {
        startPolling();
    }
    
    // Handle connection type changes
    connectionType.addEventListener('change', () => {
        if (connectionType.value === 'sse') {
            startSSE();
        } else {
            startPolling();
        }
    });
    
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