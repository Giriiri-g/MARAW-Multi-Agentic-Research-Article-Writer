class WebSocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isProcessing = false; // Track if server is processing
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.messageQueue = []; // Queue for handling multiple rapid messages
        
        this.chatDisplay = document.getElementById('chatDisplay');
        this.inputBox = document.getElementById('inputBox');
        this.sendButton = document.getElementById('sendButton');
        
        this.agentColors = {
            'Planner': 'planner',
            'Content Generator': 'content-generator',
            'Citation Manager': 'citation-manager',
            'Critic': 'critic',
            'Plagiarism Watchdog': 'plagiarism-watchdog',
            'Code Formatter': 'code-formatter',
            'System': 'system'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.connect();
    }
    
    connect() {
        try {
            this.socket = new WebSocket('ws://localhost:8765');
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleConnectionError();
        }
    }
    
    setupWebSocketHandlers() {
        this.socket.onopen = (event) => {
            console.log('Connected to WebSocket server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('Connected', 'success');
            this.sendButton.disabled = false;
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Add message to queue and process
                this.messageQueue.push(data);
                this.processMessageQueue();
            } catch (error) {
                console.error('Error parsing server message:', error);
            }
        };
        
        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed');
            this.isConnected = false;
            this.updateConnectionStatus('Disconnected', 'error');
            this.sendButton.disabled = true;
            
            // Attempt to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    console.log(`Reconnection attempt ${this.reconnectAttempts}`);
                    this.connect();
                }, 3000);
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleConnectionError();
        };
    }
    
    async processMessageQueue() {
        // Process messages from queue one by one
        while (this.messageQueue.length > 0) {
            const data = this.messageQueue.shift();
            await this.handleServerMessage(data);
        }
        
        // Re-enable input after all messages are processed
        if (!this.isProcessing) {
            this.enableInput();
        }
    }
    
    async handleServerMessage(data) {
        switch (data.type) {
            case 'agent_message':
                await this.displayAgentMessage(data.agent, data.reasoning, data.message);
                break;
            case 'error':
                this.displayErrorMessage(data.message);
                break;
            case 'processing_start':
                this.isProcessing = true;
                this.disableInput("Server is processing...");
                break;
            case 'processing_end':
                this.isProcessing = false;
                this.enableInput();
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    disableInput(placeholderText = "Processing...") {
        this.inputBox.disabled = true;
        this.sendButton.disabled = true;
        this.inputBox.placeholder = placeholderText;
    }
    
    enableInput() {
        this.inputBox.disabled = false;
        this.sendButton.disabled = false;
        this.updateInputPlaceholder();
    }
    
    async displayAgentMessage(agent, reasoning, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message agent-message';
        
        // Agent name
        const agentSpan = document.createElement('span');
        agentSpan.className = `agent-name ${this.agentColors[agent] || 'planner'}`;
        agentSpan.textContent = agent + ':';
        
        // Reasoning section (collapsible)
        const reasoningDiv = document.createElement('div');
        reasoningDiv.className = 'reasoning-section';
        
        const reasoningToggle = document.createElement('button');
        reasoningToggle.className = 'reasoning-toggle';
        reasoningToggle.textContent = 'Thought for a few seconds >';
        reasoningToggle.onclick = () => this.toggleReasoning(reasoningToggle, reasoningContent);
        
        const reasoningContent = document.createElement('div');
        reasoningContent.className = 'reasoning-content hidden';
        reasoningContent.textContent = reasoning;
        
        reasoningDiv.appendChild(reasoningToggle);
        reasoningDiv.appendChild(reasoningContent);
        
        // Message content
        const contentSpan = document.createElement('span');
        contentSpan.className = 'message-content';
        
        // Assemble message
        messageDiv.appendChild(agentSpan);
        messageDiv.appendChild(reasoningDiv);
        messageDiv.appendChild(document.createElement('br'));
        messageDiv.appendChild(contentSpan);
        
        this.chatDisplay.appendChild(messageDiv);
        this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
        
        // Type out the message (faster for multiple messages)
        await this.typeMessage(contentSpan, message, 30);
        this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
    }
    
    toggleReasoning(button, content) {
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            button.textContent = 'Thought for a few seconds v';
        } else {
            content.classList.add('hidden');
            button.textContent = 'Thought for a few seconds >';
        }
    }
    
    displayErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `<span class="agent-name" style="color: #ff6b6b;">Error:</span> ${message}`;
        this.chatDisplay.appendChild(errorDiv);
        this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
    }
    
    displayUserMessage(message) {
        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message';
        userDiv.innerHTML = `<span class="agent-name" style="color: #4ecdc4;">User:</span> ${message}`;
        this.chatDisplay.appendChild(userDiv);
        this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
    }
    
    typeMessage(element, text, speed = 100) {
        return new Promise((resolve) => {
            const words = text.split(' ');
            let i = 0;
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            cursor.textContent = '|';
            element.appendChild(cursor);

            const timer = setInterval(() => {
                if (i < words.length) {
                    const wordToAdd = (i === 0 ? '' : ' ') + words[i];
                    element.insertBefore(document.createTextNode(wordToAdd), cursor);
                    i++;
                } else {
                    clearInterval(timer);
                    cursor.remove();
                    resolve();
                }
            }, speed);
        });
    }
    
    sendMessage(message) {
        if (!this.isConnected) {
            this.displayErrorMessage('Not connected to server');
            return;
        }
        
        const messageData = {
            type: 'user_message',
            message: message,
            timestamp: Date.now()
        };
        
        try {
            this.socket.send(JSON.stringify(messageData));
            this.displayUserMessage(message);
        } catch (error) {
            console.error('Error sending message:', error);
            this.displayErrorMessage('Failed to send message');
        }
    }
    
    handleSend() {
        let input = this.inputBox.value.trim();
        if (input && this.isConnected) {
            if ($('#retry').className === 'color-2'){
                input = "critic: "+input;
            }
            this.inputBox.value = '';
            $('#retry').className = 'color-1';
            this.sendMessage(input);
            
            // Disable input while server processes
            this.disableInput("Waiting for server response...");
        }
    }
    
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSend());
        
        this.inputBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        
        // Add placeholder text update based on connection status
        this.updateInputPlaceholder();
    }
    
    updateConnectionStatus(status, type) {
        // Create or update connection status indicator
        this.updateInputPlaceholder();
    }
    
    updateInputPlaceholder() {
        if (this.isConnected) {
            this.inputBox.placeholder = "Type your message and press Enter to continue...";
        } else {
            this.inputBox.placeholder = "Connecting to server...";
        }
    }
    
    handleConnectionError() {
        this.displayErrorMessage('Connection to server failed. Please ensure the server is running.');
    }
}

// Additional CSS styles (add to your existing CSS)
const additionalStyles = `
    .reasoning-section {
        margin: 5px 0;
    }
    
    .reasoning-toggle {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        cursor: pointer;
        margin-bottom: 5px;
    }
    
    .reasoning-toggle:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .reasoning-content {
        background: rgba(0, 0, 0, 0.3);
        padding: 8px;
        border-radius: 4px;
        font-size: 11px;
        color: #ccc;
        font-style: italic;
        margin-bottom: 5px;
    }
    
    .reasoning-content.hidden {
        display: none;
    }
    
    .agent-message {
        margin-bottom: 15px;
    }
    
    .user-message {
        background: rgba(78, 205, 196, 0.1);
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 10px;
    }
    
    .error-message {
        background: rgba(255, 107, 107, 0.1);
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 10px;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the WebSocket client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.wsClient = new WebSocketClient();
});

$('#retry').on("click", function() {
            $(this).toggleClass("color-1 color-2");
});

function requestFile(fileType) {
    if (isConnected && pipelineCompleted) {
        const command = fileType === 'tex' ? 'download-tex' : 'download-pdf';
        const data = { message: command };
        ws.send(JSON.stringify(data));
        addMessage('You', `Requesting ${fileType.toUpperCase()} file...`, 'user');
    }
}

function downloadFile(base64Data, filename, fileType) {
    try {
        // Convert base64 to blob
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const mimeType = fileType === 'pdf' ? 'application/pdf' : 'text/plain';
        const blob = new Blob([bytes], { type: mimeType });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        addMessage('System', `✅ ${filename} downloaded successfully!`, 'system');
        
    } catch (error) {
        addMessage('System', `❌ Download failed: ${error}`, 'error');
    }
}