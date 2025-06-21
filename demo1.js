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

// Sample conversation data
const sampleConversation = [
    { agent: 'Planner', message: "I've parsed the input. The topic is *Federated Learning for Healthcare Data Privacy*. The target journal is *Springer LNCS*. No abstract provided. I'll fetch the Springer LNCS template metadata and define the paper outline." },
    { agent: 'Planner', message: 'Retrieved Springer LNCS template. Word limit is approximately 5000 words. Expected sections are: Abstract, Introduction, Related Work, Methodology, Experiments, Conclusion. Now generating section-wise word targets and a writing plan.' },
    { agent: 'Planner', message: 'Section Outline:\n* Abstract: 250 words\n* Introduction: 800 words\n* Related Work: 800 words\n* Methodology: 1000 words\n* Experiments & Results: 1000 words\n* Conclusion: 600 words\nReady to delegate writing and citation tasks.' },
    { agent: 'Content Generator', message: 'Generating the abstract based on topic... "Federated Learning (FL) enables collaborative model training without data sharing, offering promising applications in healthcare..."' },
    { agent: 'Content Generator', message: 'Starting Introduction draft... "Data privacy regulations such as HIPAA and GDPR restrict centralized data collection... Federated Learning offers a paradigm shift..."' },
    { agent: 'Citation Manager', message: 'Initiating literature query on "Federated Learning in healthcare" using Semantic Scholar. Found 42 relevant papers. Extracting BibTeX entries and filtering for relevance.' },
    { agent: 'Citation Manager', message: 'Selected top 10 citations. Mapping references to sections:\n* Introduction: 2\n* Related Work: 4\n* Methodology: 2\n* Experiments: 2\nGenerating references.bib.' },
    { agent: 'Content Generator', message: 'Drafting Related Work... "Several recent works [1,2,3] explore decentralized training models in clinical settings..."' },
    { agent: 'Critic', message: 'Running critique on Introduction and Related Work... Issues identified:\n* Introduction is missing a clear problem statement\n* Related Work needs stronger contrast between FL and centralized models\nSuggestion: Expand the first paragraph of Introduction and rephrase the final paragraph of Related Work.' },
    { agent: 'Plagiarism Watchdog', message: 'Plagiarism check on Introduction: 8% overlap – acceptable\nRelated Work: 32% overlap – flagged\nSending flagged section back to ContentGenerator for paraphrasing.' },
    { agent: 'Content Generator', message: 'Received flagged content. Paraphrased the final paragraph of Related Work to improve originality.' },
    { agent: 'Critic', message: 'Re-evaluating Related Work... Clarity improved. Logical flow is stronger. Tone is consistent with academic writing.' },
    { agent: 'Code Formatter', message: 'Assembling LaTeX document.\n* Injected document preamble\n* Inserted cleaned section texts\n* Applied citation style using BibTeX\n* Formatted math and code blocks' },
    { agent: 'Code Formatter', message: 'Compiled final PDF. File paper.pdf generated successfully. Running validation checks...' },
    { agent: 'Code Formatter', message: 'Validation complete. No compile errors. All references and figures are intact. The paper is ready for download.' }
];

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

async function displayMessage(agent, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const agentSpan = document.createElement('span');
    agentSpan.className = `agent-name ${agentColors[agent] || 'planner'}`;
    agentSpan.textContent = agent + ':';

    const contentSpan = document.createElement('span');
    contentSpan.className = 'message-content';

    messageDiv.appendChild(agentSpan);
    messageDiv.appendChild(document.createTextNode(' '));
    messageDiv.appendChild(contentSpan);

    chatDisplay.appendChild(messageDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;

    await typeMessage(contentSpan, message, 150);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

async function simulateConversation() {
    isTyping = true;
    sendButton.disabled = true;

    for (let i = 0; i < sampleConversation.length; i++) {
        const { agent, message } = sampleConversation[i];
        await displayMessage(agent, message);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between messages
    }

    isTyping = false;
    sendButton.disabled = false;
}

function handleSend() {
    const input = inputBox.value.trim();
    if (input && !isTyping) {
        inputBox.value = '';

        // Display user message
        const userDiv = document.createElement('div');
        userDiv.className = 'message';
        userDiv.innerHTML = `<span class="agent-name" style="color: #fff;">User:</span> ${input}`;
        chatDisplay.appendChild(userDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        // Simulate agent responses based on input
        setTimeout(() => {
            simulateConversation();
        }, 500);
    }
}

// Event listeners
sendButton.addEventListener('click', handleSend);
inputBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});

// Auto-start demo conversation after 2 seconds
setTimeout(() => {
    simulateConversation();
}, 2000);


// 
// Login Popup + Contact Popup Scripts
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