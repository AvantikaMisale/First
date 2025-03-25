/**
 * AI Chat functionality for financial assistant
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize chat if on a page with chat interface
    if (document.getElementById('chat-container')) {
        initializeChat();
    }
});

// Initialize chat interface
function initializeChat() {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const suggestedQuestions = document.querySelectorAll('.suggested-question');
    
    // Add event listener for chat form submission
    if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const message = messageInput.value.trim();
            if (!message) return;
            
            // Add user message to the chat
            addMessage('user', message);
            
            // Clear input field
            messageInput.value = '';
            
            // Send message to backend
            sendMessage(message);
        });
    }
    
    // Add event listeners for suggested questions
    if (suggestedQuestions) {
        suggestedQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const message = this.textContent.trim();
                
                // Add user message to the chat
                addMessage('user', message);
                
                // Clear input field
                if (messageInput) messageInput.value = '';
                
                // Send message to backend
                sendMessage(message);
            });
        });
    }
    
    // Add initial greeting from the assistant
    if (chatMessages && chatMessages.children.length === 0) {
        const greeting = getTranslation('chat.greeting') || 
            'Hello! I\'m your financial assistant. How can I help you today? You can ask me about stocks, cryptocurrencies, investment advice, or financial concepts.';
        
        addMessage('assistant', greeting);
    }
}

// Add a message to the chat
function addMessage(sender, content) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}-message`;
    
    // Create avatar and message content
    const avatarElement = document.createElement('div');
    avatarElement.className = 'chat-avatar';
    
    // Set avatar based on sender
    if (sender === 'user') {
        avatarElement.innerHTML = '<i class="bi bi-person-circle"></i>';
    } else {
        avatarElement.innerHTML = '<i class="bi bi-robot"></i>';
    }
    
    const contentElement = document.createElement('div');
    contentElement.className = 'chat-content';
    
    // Format links in messages
    const formattedContent = formatMessage(content);
    contentElement.innerHTML = formattedContent;
    
    // Add timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'chat-timestamp';
    timestampElement.textContent = new Date().toLocaleTimeString();
    
    // Assemble message
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    // Add to chat window
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add a loading indicator while waiting for response
function addLoadingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'chat-message assistant-message loading-message';
    loadingElement.id = 'loading-message';
    
    // Create avatar and loading content
    const avatarElement = document.createElement('div');
    avatarElement.className = 'chat-avatar';
    avatarElement.innerHTML = '<i class="bi bi-robot"></i>';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'chat-content';
    contentElement.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    
    // Assemble loading message
    loadingElement.appendChild(avatarElement);
    loadingElement.appendChild(contentElement);
    
    // Add to chat window
    chatMessages.appendChild(loadingElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove loading indicator
function removeLoadingIndicator() {
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Send message to backend
function sendMessage(message) {
    // Add loading indicator
    addLoadingIndicator();
    
    // Disable input while processing
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('#chat-form button[type="submit"]');
    
    if (messageInput) messageInput.disabled = true;
    if (sendButton) sendButton.disabled = true;
    
    // Send request to API
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Remove loading indicator
        removeLoadingIndicator();
        
        // Enable input
        if (messageInput) messageInput.disabled = false;
        if (sendButton) sendButton.disabled = false;
        
        // Focus on input field
        if (messageInput) messageInput.focus();
        
        // Check for error
        if (data.error) {
            addMessage('assistant', getTranslation('chat.error') || 'Sorry, I encountered an error processing your request. Please try again.');
            console.error('Chat API error:', data.error);
            return;
        }
        
        // Add assistant's response to the chat
        addMessage('assistant', data.response);
    })
    .catch(error => {
        console.error('Error sending message:', error);
        
        // Remove loading indicator
        removeLoadingIndicator();
        
        // Enable input
        if (messageInput) messageInput.disabled = false;
        if (sendButton) sendButton.disabled = false;
        
        // Add error message
        addMessage('assistant', getTranslation('chat.error') || 'Sorry, I encountered an error processing your request. Please try again.');
    });
}

// Format message to handle links, code blocks, etc.
function formatMessage(message) {
    if (!message) return '';
    
    // Replace URLs with actual links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formattedMessage = message.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    
    // Format markdown-style code blocks
    const codeBlockRegex = /```([^`]+)```/g;
    formattedMessage = formattedMessage.replace(codeBlockRegex, (match, code) => {
        return `<pre class="code-block"><code>${code}</code></pre>`;
    });
    
    // Format markdown-style inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    formattedMessage = formattedMessage.replace(inlineCodeRegex, (match, code) => {
        return `<code class="inline-code">${code}</code>`;
    });
    
    // Format markdown-style bold text
    const boldRegex = /\*\*([^*]+)\*\*/g;
    formattedMessage = formattedMessage.replace(boldRegex, (match, text) => {
        return `<strong>${text}</strong>`;
    });
    
    // Format markdown-style italic text
    const italicRegex = /\*([^*]+)\*/g;
    formattedMessage = formattedMessage.replace(italicRegex, (match, text) => {
        return `<em>${text}</em>`;
    });
    
    // Handle line breaks
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');
    
    return formattedMessage;
}

// Clear chat history
function clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Remove all messages except the greeting
    while (chatMessages.children.length > 1) {
        chatMessages.removeChild(chatMessages.lastChild);
    }
}
