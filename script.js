/* --- AIDLEX AI V7.2: FINAL PRODUCTION SCRIPT --- */

document.addEventListener('DOMContentLoaded', () => {

    // --- Get Main Elements ---
    const chatContainer = document.getElementById('chat-container');
    const getStartedBtn = document.getElementById('get-started-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputArea = document.getElementById('chat-input-area');
    const startScreen = document.getElementById('start-screen');

    let userName = '';
    
    // --- TTS State & Voice Enhancement ---
    let isSpeaking = false;
    let currentUtterance = null;
    let preferredVoice = null;
    const synth = window.speechSynthesis;

    // Function to find a high-quality, human-like voice
    function loadHumanVoice() {
        const voices = synth.getVoices();
        if (voices.length === 0) return;

        // --- Voice Preferences ---
        const voiceNames = [
            'Google US English', // High-quality on Chrome
            'Siri', // High-quality on Safari/iOS
            'Microsoft Zira Desktop - English (United States)', // High-quality on Edge/Windows
            'Microsoft David Desktop - English (United States)',
            'Google UK English Female',
            'Google UK English Male'
        ];

        // Find the first matching voice
        preferredVoice = voices.find(voice => voiceNames.includes(voice.name) && voice.lang.startsWith('en'));

        if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang === 'en-US' || voice.lang === 'en-GB');
        }
        if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
    }

    // Load voices immediately and also set up a listener
    loadHumanVoice();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadHumanVoice;
    }
    // --- End of TTS Enhancement ---


    // --- SVG ICONS ---
    const sendIcon = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
    const uploadIcon = `<svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>`;
    const micIcon = `<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>`;
    const copyIcon = `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const ttsIcon = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    const stopIcon = `<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>`;

    // --- Step 1: Handle "Get Started" Button Click ---
    getStartedBtn.addEventListener('click', () => {
        startScreen.style.transition = 'opacity 0.5s ease-out';
        startScreen.style.opacity = '0';
        setTimeout(() => {
            startScreen.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            startBotConversation();
        }, 500);
    });

    // --- Step 2: Start the Bot Conversation Flow ---
    async function startBotConversation() {
        await delay(500);
        addBotMessage("Hello! I'm Aidlex Ai, your UAE government service assistant.");
        await delay(1200);
        addBotMessage("To get started, could you please tell me your name?");
        showUserInfoForm(); 
    }

    // --- Step 3: Show the User Info Form ---
    function showUserInfoForm() {
        chatInputArea.innerHTML = `
            <form id="user-info-form" class="user-info-form">
                <input type="text" id="name-input" placeholder="Your Name" required>
                <input type="email" id="email-input" placeholder="Your Email">
                <input type="tel" id="phone-input" placeholder="Phone Number (Optional)">
                <button type="submit">Submit</button>
            </form>
        `;
        const form = chatInputArea.querySelector('#user-info-form');
        form.addEventListener('submit', handleFormSubmit);
    }

    // --- Step 4: Handle Form Submission ---
    async function handleFormSubmit(event) {
        event.preventDefault();
        const nameInput = chatInputArea.querySelector('#name-input');
        userName = nameInput.value.trim();

        if (!userName) {
            addBotMessage("Please enter your name to continue.");
            return;
        }

        addUserMessage(`My name is ${userName}`);
        chatInputArea.innerHTML = `<div class="input-placeholder">Please select an option above</div>`;

        await delay(1000);
        addBotMessage(`Welcome, ${userName}! It's nice to meet you.`);
        await delay(1200);
        addBotServiceOptions();
    }

    // --- Step 5: Show Main Service Options ---
    function addBotServiceOptions() {
        const serviceHTML = `
            <strong>How can I assist you today? Please select a category:</strong>
            <div class="category-header">Main UAE Services</div>
            <div class="service-grid grid-4">
                <button class="service-card" data-service="ded">DED (Economic)</button>
                <button class="service-card" data-service="municipality">Municipality</button>
                <button class="service-card" data-service="tamm_amer">TAMM / Amer</button>
                <button class="service-card" data-service="icp">ICP (Identity)</button>
                <button class="service-card" data-service="rta">RTA (Transport)</button>
                <button class="service-card" data-service="legal">Legal Assistance</button>
                <button class="service-card" data-service="general">General Enquiry</button>
            </div>
            <div class="category-header">Common Requests</div>
            <div class="service-grid">
                <button class="service-card" data-service="letter">Request Letters</button>
                <button class="service-card" data-service="complaint">Complaint Formats</button>
                <button class="service-card" data-service="translation">Translation</button>
            </div>
        `;
        const messageElement = addBotMessage(serviceHTML, false);
        
        messageElement.querySelectorAll('.service-card').forEach(button => {
            button.addEventListener('click', handleServiceSelection);
        });
    }

    // --- Step 6: Helper to build sub-options ---
    function addBotOptionsGrid(prompt, options, columns = 3) {
        let optionsHTML = '';
        for (const option of options) {
            optionsHTML += `<button class="service-card" data-service="${option.key}">${option.text}</button>`;
        }
        const gridClass = columns === 4 ? 'service-grid grid-4' : 'service-grid';
        const serviceHTML = `
            <strong>${prompt}</strong>
            <div class="${gridClass}">
                ${optionsHTML}
            </div>
        `;
        const messageElement = addBotMessage(serviceHTML, false);
        
        messageElement.querySelectorAll('.service-card').forEach(button => {
            button.addEventListener('click', handleServiceSelection);
        });
    }

    // --- Step 7: Helper to Show Text Input ---
    function showFreeTextInput(placeholder = "Type your message...") {
        synth.cancel(); // Stop any speech
        
        chatInputArea.innerHTML = `
            <button class="icon-button" id="upload-btn" title="Upload File (PDF, JPG, TXT)">
                ${uploadIcon}
            </button>
            <form id="free-text-form" class="free-text-form">
                <input type="text" id="text-input" placeholder="${placeholder}" required>
                <button type="submit" class="send-btn" title="Send Message">
                    ${sendIcon}
                </button>
            </form>
            <button class="icon-button" id="stt-btn" title="Use Voice-to-Text">
                ${micIcon}
            </button>
        `;
        const form = chatInputArea.querySelector('#free-text-form');
        form.addEventListener('submit', handleFreeTextSubmit);
        chatInputArea.querySelector('#text-input').focus();
        chatInputArea.querySelector('#upload-btn').addEventListener('click', handleUploadClick);
        chatInputArea.querySelector('#stt-btn').addEventListener('click', handleSTTClick);
    }

    // --- Step 8: Handler for Text Input ---
    async function handleFreeTextSubmit(event) {
        event.preventDefault();
        synth.cancel();
        const input = chatInputArea.querySelector('#text-input');
        const query = input.value.trim();
        if (!query) return;

        addUserMessage(query);
        chatInputArea.innerHTML = `<div class="input-placeholder">Processing...</div>`;

        await delay(1500);
        addBotMessage("Thank you. Based on your information, here is a general outlook.");
        
        await delay(1500);
        const outlookHTML = `
            <strong>Outlook</strong>
            <ul>
                <li>You will likely need to gather all relevant documents (e.g., contracts, notifications).</li>
                <li>The next step is typically to file a formal complaint or request.</li>
                <li>Timelines can vary from 2-4 weeks depending on the case.</li>
            </ul>
        `;
        addBotMessage(outlookHTML, false);
        
        await delay(2000);
        addBotMessage("For a full, detailed strategy and bilingual document set I can connect you to a live Aidlex executive. Shall I book an appointment?");
        
        await delay(1000);
        addBotMessage("<em>Disclaimer: I am an AI legal information tool, not a substitute for personalised legal advice. Consult a licensed advocate.</em>");

        await delay(3000);
        addBotMessage("Do you need help with anything else?");
        addBotServiceOptions();
        chatInputArea.innerHTML = `<div class="input-placeholder">Please select an option above</div>`;
    }

    // --- Step 9: Main Service Handler ---
    async function handleServiceSelection(event) {
        const selectedButton = event.target.closest('.service-card');
        if (!selectedButton || selectedButton.disabled) return;
        
        synth.cancel();

        const selectedServiceText = selectedButton.innerText;
        const selectedServiceKey = selectedButton.dataset.service;

        addUserMessage(selectedServiceText);

        const parentMessage = selectedButton.closest('.service-options');
        if (parentMessage) {
            parentMessage.classList.add('options-used');
            parentMessage.querySelectorAll('.service-card').forEach(card => {
                card.disabled = true;
            });
        }
        
        chatInputArea.innerHTML = `<div class="input-placeholder">Please wait...</div>`;
        await delay(1200);

        switch (selectedServiceKey) {
            case 'municipality':
                addBotOptionsGrid('What specific Municipality service do you need?', [
                    { text: 'Building Permits', key: 'mun-permits' },
                    { text: 'Waste Management', key: 'mun-waste' },
                    { text: 'Public Parks', key: 'mun-parks' },
                    { text: 'Rent Disputes', key: 'mun-rent' }
                ], 4);
                break;
            case 'ded':
                addBotOptionsGrid('What DED service are you looking for?', [
                    { text: 'New License', key: 'ded-new' },
                    { text: 'Renew License', key: 'ded-renew' },
                    { text: 'Trade Name', key: 'ded-trade' },
                    { text: 'Permits', key: 'ded-permits' }
                ], 4);
                break;
            case 'general':
                addBotMessage("Sure. Please type your general question below.");
                showFreeTextInput("Type your general question...");
                break;
            default:
                addBotMessage(`Understood. I can provide information on ${selectedServiceText}.`);
                await delay(1500);
                
                const timeInDubai = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dubai', hour: '2-digit', hour12: false });
                const hour = parseInt(timeInDubai);
                let greeting = "Good evening";
                if (hour >= 5 && hour < 12) greeting = "Good morning";
                if (hour >= 12 && hour < 18) greeting = "Good afternoon";
                
                addBotMessage(`${greeting}. To provide accurate information, I need to ask a few clarifying questions.`);
                await delay(1500);
                addBotMessage("First, could you please describe your role in this matter? (e.g., landlord, tenant, contractor, complainant)");
                await delay(1000);
                addBotMessage("<em>Disclaimer: I am an AI legal information tool, not a substitute for personalised legal advice. Consult a licensed advocate.</em>");
                
                showFreeTextInput("Please describe your role...");
                break;
        }
    }
    
    // --- Input Icon Handlers ---
    function handleUploadClick() {
        synth.cancel();
        addBotMessage("You've clicked 'Upload'. This feature is for demonstration. Simulating file analysis...");
        addUserMessage("<em>[User uploaded file: contract.pdf]</em>");
        
        setTimeout(() => {
            addBotMessage("Thank you. I have analyzed the document. It appears to be a standard tenancy contract. Please describe your role so I can assist you further.");
        }, 2000);
    }

    function handleSTTClick() {
        synth.cancel();
        const input = chatInputArea.querySelector('#text-input');
        if (input) {
            input.placeholder = "Listening... speak now.";
            setTimeout(() => {
                input.value = "This is a simulated voice-to-text result.";
                input.placeholder = "Type your message...";
            }, 3000);
        }
    }

    // --- Message Toolbar Handlers ---
    function handleCopyClick(event) {
        const button = event.currentTarget;
        const messageElement = button.closest('.chat-message');
        let contentToCopy = "";
        const contentDiv = messageElement.querySelector('.message-content');
        
        if (contentDiv) {
            contentToCopy = contentDiv.innerText;
        } else {
            const prompt = messageElement.querySelector('strong');
            if (prompt) contentToCopy = prompt.innerText;
            else contentToCopy = messageElement.innerText;
            
            const toolbarText = messageElement.querySelector('.message-toolbar').innerText;
            contentToCopy = contentToCopy.replace(toolbarText, '').trim();
        }
        
        navigator.clipboard.writeText(contentToCopy).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    function handleTTSClick(event) {
        const button = event.currentTarget;
        const messageElement = button.closest('.chat-message');
        
        if (isSpeaking) {
            synth.cancel();
            return;
        }

        let contentToSpeak = "";
        const contentDiv = messageElement.querySelector('.message-content');
        
        if (contentDiv) {
            contentToSpeak = contentDiv.innerText;
        } else {
            const prompt = messageElement.querySelector('strong');
            if (prompt) contentToSpeak = prompt.innerText;
            else {
                contentToSpeak = messageElement.innerText;
                const toolbarText = messageElement.querySelector('.message-toolbar').innerText;
                contentToSpeak = contentToSpeak.replace(toolbarText, '').trim();
            }
        }

        currentUtterance = new SpeechSynthesisUtterance(contentToSpeak);
        
        // --- SET THE HUMAN VOICE ---
        if (preferredVoice) {
            currentUtterance.voice = preferredVoice;
        }
        
        currentUtterance.onstart = () => {
            isSpeaking = true;
            button.classList.add('active');
            button.innerHTML = stopIcon;
        };
        currentUtterance.onend = () => {
            isSpeaking = false;
            button.classList.remove('active');
            button.innerHTML = ttsIcon;
            currentUtterance = null;
        };
        currentUtterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            isSpeaking = false;
            button.classList.remove('active');
            button.innerHTML = ttsIcon;
        };
        synth.speak(currentUtterance);
    }

    // --- Utility Functions (VERIFIED) ---
    /**
     * @param {string} htmlContent - The text or HTML to add.
     * @param {boolean} includeTTS - Whether to add the TTS button.
     * @returns {HTMLElement} The new message element.
     */
    function addBotMessage(htmlContent, includeTTS = true) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'bot');

        const isComplex = /<[a-z][\s\S]*>/i.test(htmlContent);

        if (isComplex) {
            messageElement.innerHTML = htmlContent;
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('message-content');
            contentDiv.textContent = htmlContent;
            messageElement.appendChild(contentDiv);
        }

        const toolbar = document.createElement('div');
        toolbar.classList.add('message-toolbar');
        
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('icon-button', 'copy-btn');
        copyBtn.title = "Copy text";
        copyBtn.innerHTML = copyIcon;
        copyBtn.addEventListener('click', handleCopyClick);
        toolbar.appendChild(copyBtn);

        if (includeTTS && !isComplex) { 
            const ttsBtn = document.createElement('button');
            ttsBtn.classList.add('icon-button', 'tts-btn');
            ttsBtn.title = "Read aloud";
            ttsBtn.innerHTML = ttsIcon;
            ttsBtn.addEventListener('click', handleTTSClick);
            toolbar.appendChild(ttsBtn);
        } else if (isComplex) {
            messageElement.style.paddingBottom = "10px";
            if (!messageElement.classList.contains('service-options')) {
                messageElement.classList.add('service-options');
            }
        }

        messageElement.appendChild(toolbar);
        chatMessages.appendChild(messageElement);
        scrollToBottom();
        
        return messageElement;
    }

    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'user');
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.innerHTML = text;
        messageElement.appendChild(contentDiv);

        const toolbar = document.createElement('div');
        toolbar.classList.add('message-toolbar');
        
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('icon-button', 'copy-btn');
        copyBtn.title = "Copy text";
        copyBtn.innerHTML = copyIcon;
        copyBtn.addEventListener('click', handleCopyClick);
        toolbar.appendChild(copyBtn);
        
        messageElement.appendChild(toolbar);
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- DARK MODE LOGIC ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    function enableDarkMode() {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        darkModeToggle.checked = true;
    }
    function disableDarkMode() {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        darkModeToggle.checked = false;
    }
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
});