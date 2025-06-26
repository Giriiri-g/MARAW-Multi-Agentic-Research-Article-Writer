const chatDisplay = document.getElementById('chatDisplay');
const inputBox = document.getElementById('inputBox');
const sendButton = document.getElementById('sendButton');

const agentColors = {
    'Planner': 'planner',
    'Content Generator': 'content-generator',
    'Citation Manager': 'citation-manager',
    'Critic': 'critic',
    'Plagiarism Watchdog': 'plagiarism-watchdog',
    'Code Formatter': 'code-formatter'
};

let isTyping = false;
let serverUrl = 'http://0.0.0.0:5000'; // Python server URL

function typeMessage(element, text, speed = 100) {
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

async function displayServerMessage(agent, reasoning, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message server-message';

    // Create agent section
    const agentDiv = document.createElement('div');
    agentDiv.className = 'agent-section';
    const agentSpan = document.createElement('span');
    agentSpan.className = `agent-name ${agentColors[agent] || 'planner'}`;
    agentSpan.textContent = agent + ':';
    agentDiv.appendChild(agentSpan);

    // Create reasoning section
    const reasoningDiv = document.createElement('div');
    reasoningDiv.className = 'reasoning-section';
    const reasoningLabel = document.createElement('strong');
    reasoningLabel.textContent = 'Reasoning: ';
    reasoningLabel.style.color = '#888';
    const reasoningContent = document.createElement('span');
    reasoningContent.className = 'reasoning-content';
    reasoningContent.style.fontStyle = 'italic';
    reasoningContent.style.color = '#666';
    reasoningDiv.appendChild(reasoningLabel);
    reasoningDiv.appendChild(reasoningContent);

    // Create message section
    const messageContentDiv = document.createElement('div');
    messageContentDiv.className = 'message-section';
    const messageLabel = document.createElement('strong');
    messageLabel.textContent = 'Message: ';
    messageLabel.style.color = '#333';
    const messageContent = document.createElement('span');
    messageContent.className = 'message-content';
    messageContentDiv.appendChild(messageLabel);
    messageContentDiv.appendChild(messageContent);

    // Assemble the message
    messageDiv.appendChild(agentDiv);
    messageDiv.appendChild(reasoningDiv);
    messageDiv.appendChild(messageContentDiv);

    chatDisplay.appendChild(messageDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;

    // Type out each section with delays
    await typeMessage(reasoningContent, reasoning, 80);
    await new Promise(resolve => setTimeout(resolve, 500));
    await typeMessage(messageContent, message, 100);
    
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function displayUserMessage(userInput) {
    const userDiv = document.createElement('div');
    userDiv.className = 'message user-message';
    userDiv.innerHTML = `<span class="agent-name" style="color: #fff; background: #007bff; padding: 2px 8px; border-radius: 4px;">User:</span> ${userInput}`;
    userDiv.style.marginBottom = '10px';
    userDiv.style.textAlign = 'right';
    chatDisplay.appendChild(userDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

async function sendMessageToServer(userMessage) {
    try {
        const response = await fetch(`${serverUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Display the server response
        await displayServerMessage(data.agent, data.reasoning, data.message);
        
    } catch (error) {
        console.error('Error sending message to server:', error);
        
        // Display error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `<span style="color: #ff4444;">Error:</span> Failed to connect to server. ${error.message}`;
        errorDiv.style.color = '#ff4444';
        errorDiv.style.border = '1px solid #ff4444';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.margin = '5px 0';
        chatDisplay.appendChild(errorDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
}

async function handleSend() {
    const input = inputBox.value.trim();
    if (input && !isTyping) {
        inputBox.value = '';
        isTyping = true;
        sendButton.disabled = true;

        // Display user message
        displayUserMessage(input);

        // Send to server and display response
        await sendMessageToServer(input);

        isTyping = false;
        sendButton.disabled = false;
    }
}

// Test server connection on page load
async function testServerConnection() {
    try {
        const response = await fetch(`${serverUrl}/health`);
        if (response.ok) {
            console.log('✅ Server connection successful');
            
            // Display connection success message
            const successDiv = document.createElement('div');
            successDiv.className = 'message system-message';
            successDiv.innerHTML = `<span style="color: #52efa6;">System:</span> Connected to server successfully. You can start chatting!`;
            successDiv.style.color = '#52efa6';
            successDiv.style.fontStyle = 'italic';
            successDiv.style.margin = '10px 0';
            chatDisplay.appendChild(successDiv);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    } catch (error) {
        console.log('❌ Server connection failed:', error);
        
        // Display connection error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message system-message';
        errorDiv.innerHTML = `<span style="color: #ff4444;">System:</span> Could not connect to server. Please make sure the Python server is running on ${serverUrl}`;
        errorDiv.style.color = '#ff4444';
        errorDiv.style.fontStyle = 'italic';
        errorDiv.style.margin = '10px 0';
        chatDisplay.appendChild(errorDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
}

// Event listeners
sendButton.addEventListener('click', handleSend);
inputBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isTyping) {
        handleSend();
    }
});

// Test server connection when page loads
window.addEventListener('load', () => {
    setTimeout(testServerConnection, 1000);
});

// 
// Login Popup + Contact Popup Scripts (keeping existing functionality)
// 

$(document).ready(function () {
    let isLoggedIn = false;

    const loginFields = [
        {
            id: '#username',
            header: '#username-header',
            validate: v => v.trim().length >= 3,
            errorMsg: 'X Username must be at least 3 characters'
        },
        {
            id: '#password',
            header: '#password-header',
            validate: v => v.length >= 6,
            errorMsg: 'X Password must be at least 6 characters'
        }
    ];

    let validationStarted = false;

    function validateField(f) {
        const val = $(f.id).val();
        const $header = $(f.header);
        $header.find('.error-field').remove();

        if (f.validate(val)) {
            $header.css('color', '#52efa6');
            return true;
        } else {
            $header.css('color', '#f43c33');
            $('<span>')
                .addClass('error-field')
                .text(f.errorMsg)
                .appendTo($header);
            return false;
        }
    }

    function validateAll() {
        return loginFields.map(f => validateField(f)).every(v => v);
    }

    function resetForm() {
        validationStarted = false;
        loginFields.forEach(f => {
            $(f.header).css('color', '').find('.error-field').remove();
            $(f.id).val('');
        });
    }

    function showLoginPopup() {
        $('#login-overlay').fadeIn();
        $('#login-overlay').css('display', 'flex');
    }

    function hideLoginPopup() {
        $('#login-overlay').fadeOut();
        resetForm();
    }

    $('#authToggleBtn').click(function () {
        if (!isLoggedIn) {
            showLoginPopup();
        } else {
            // Log out
            isLoggedIn = false;
            $('#authToggleBtn').text('Login');
            $('#user-welc').hide().text('');
            localStorage.removeItem('username');
        }
    });

    $('#login-close').click(function () {
        hideLoginPopup();
    });

    $('#login-overlay').click(function (e) {
        if (e.target === this) {
            hideLoginPopup();
        }
    });

    loginFields.forEach(f => {
        $(f.id).on('input', () => {
            if (validationStarted) validateField(f);
        });
    });

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const valid = validateAll();

        if (!validationStarted) {
            validationStarted = true;
        }

        if (!valid) return;

        // Successful login
        const username = $('#username').val().trim();
        isLoggedIn = true;
        $('#authToggleBtn').text('Logout');
        $('#user-welc').text(`Welcome, ${username}`).show();
        localStorage.setItem('username', username);
        hideLoginPopup();
    });

    // Restore login if user is remembered
    const savedUser = localStorage.getItem('username');
    if (savedUser) {
        isLoggedIn = true;
        $('#authToggleBtn').text('Logout');
        $('#user-welc').text(`Welcome, ${savedUser}`).show();
    }
});

$(document).ready(function () {
    // FIELD CONFIGURATION
    const contactFields = [
        {
            selector: '#name1',
            header: '#name-header',
            validate: v => v.trim() !== '',
            errorMsg: 'Name cannot be empty'
        },
        {
            selector: '#email1',
            header: '#email-header',
            validate: v => /^\S+@\S+\.\S+$/.test(v),
            errorMsg: 'Please enter a valid email'
        },
        {
            selector: '#message1',
            header: '#message-header',
            validate: v => v.trim() !== '',
            errorMsg: 'Message cannot be empty'
        }
    ];

    let contactValidationActive = false;

    // SHOW / HIDE FUNCTIONS
    function showContact() {
        $('#contactoverlay').fadeIn()
        $('#contactoverlay').css('display', 'flex');
        contactValidationActive = false;
    }
    function hideContact() {
        $('#contactoverlay').fadeOut()
        $('#contactoverlay').hide();
        resetContactForm();
    }

    // RESET FORM & ERRORS
    function resetContactForm() {
        contactValidationActive = false;
        contactFields.forEach(f => {
            $(f.header).css('color', '').find('.error-field').remove();
            $(f.selector).val('');
        });
    }

    // VALIDATE A SINGLE FIELD
    function validateContactField(f) {
        const $input = $(f.selector);
        const $hdr = $(f.header);
        $hdr.find('.error-field').remove();

        if (f.validate($input.val())) {
            $hdr.css('color', '#52efa6');
            return true;
        } else {
            $hdr.css('color', '#f43c33');
            $('<span>')
                .addClass('error-field')
                .text(f.errorMsg)
                .appendTo($hdr);
            return false;
        }
    }

    // VALIDATE ALL
    function validateContactAll() {
        return contactFields.map(f => validateContactField(f)).every(ok => ok);
    }

    // OPENERS/CLOSERS
    $('#contactBtn').click(showContact);
    $('#contactoverlay').on('click', e => {
        if (e.target === e.currentTarget) hideContact();
    });
    $('#contactoverlay').find('button[onclick="contactclose()"]').click(hideContact);

    // LIVE VALIDATION
    contactFields.forEach(f => {
        $(f.selector).on('input', () => {
            if (contactValidationActive) validateContactField(f);
        });
    });

    // FORM SUBMIT
    $('#contactoverlay form').on('submit', function (e) {
        e.preventDefault();

        contactValidationActive = true;
        if (!validateContactAll()) return;

        hideContact();
    });
});