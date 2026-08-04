document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatFlow = document.getElementById('chat-flow');
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    const newChatBtn = document.querySelector('.new-chat-btn');

    // Sidebar Toggle
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        const newHeight = Math.min(this.scrollHeight, 200);
        this.style.height = newHeight + 'px';
        
        if(this.value.trim().length > 0) {
            sendBtn.classList.add('active');
        } else {
            sendBtn.classList.remove('active');
        }
    });

    // Handle Enter and Send
    chatInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    sendBtn.addEventListener('click', handleSend);

    // Suggestions
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const promptText = card.querySelector('p').innerText;
            chatInput.value = promptText;
            chatInput.style.height = 'auto';
            sendBtn.classList.add('active');
            handleSend();
        });
    });

    // Reset Chat
    newChatBtn.addEventListener('click', () => {
        chatFlow.innerHTML = '';
        chatFlow.style.display = 'none';
        welcomeScreen.style.display = 'block';
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.classList.remove('active');
    });

    async function handleSend() {
        const text = chatInput.value.trim();
        if(!text) return;

        if(welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
            chatFlow.style.display = 'flex';
        }

        addUserMessage(text);
        
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.classList.remove('active');

        const typingId = addTypingIndicator();
        scrollToBottom();

        // Simulate thinking time to feel real
        await new Promise(res => setTimeout(res, 1000 + Math.random() * 2000));
        
        // Use the smart local response engine instead of asking for API key
        const response = window.getSmartResponse(text);
        
        removeTypingIndicator(typingId);
        addAIMessage(response);
        scrollToBottom();
    }

    function addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message user-message';
        const escapedText = parseText(text);
        msgDiv.innerHTML = `
            <div class="avatar user-avatar">RW</div>
            <div class="msg-content">${escapedText}</div>
        `;
        chatFlow.appendChild(msgDiv);
    }

    function addAIMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ai-message';
        const formattedText = formatAIResponse(text);
        msgDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <span class="material-symbols-outlined gradient-icon" style="font-size:28px;">diamond</span>
            </div>
            <div class="msg-content">${formattedText}</div>
        `;
        chatFlow.appendChild(msgDiv);
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ai-message';
        msgDiv.id = id;
        msgDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <span class="material-symbols-outlined gradient-icon" style="font-size:28px;">diamond</span>
            </div>
            <div class="msg-content"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>
        `;
        chatFlow.appendChild(msgDiv);
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if(el) el.remove();
    }

    function scrollToBottom() {
        const container = document.querySelector('.chat-container');
        container.scrollTop = container.scrollHeight;
    }

    function parseText(text) {
        return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    }

    function formatAIResponse(text) {
        let formatted = parseText(text);
        // Code block formatting
        formatted = formatted.replace(/```(.*?)```/gs, "<pre style='background:#111; padding: 10px; border-radius: 8px; margin-top: 8px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.05);'><code>$1</code></pre>");
        formatted = formatted.replace(/`(.*?)`/g, "<code style='background:#111; padding: 2px 4px; border-radius: 4px; color: #a8c7fa;'>$1</code>");
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        formatted = formatted.replace(/\* (.*?)(<br>|$)/g, "<li>$1</li>");
        formatted = formatted.replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>");
        formatted = formatted.replace(/<\/ul><ul>/g, "");
        return formatted;
    }
});
