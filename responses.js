const LineAI_Database = {
    "greetings": [
        { "keywords": ["hi", "hello", "hey", "greet"], "response": "Hello! I am Line, your personal AI assistant. How can I help you today, Remy William?" },
        { "keywords": ["morning"], "response": "Good morning, Remy William! Ready to achieve something great today?" },
        { "keywords": ["night"], "response": "Good night, Remy William! Rest well, I'll be here when you get back." }
    ],
    "identity": [
        { "keywords": ["who are you", "what is your name"], "response": "My name is Line. I am a sophisticated AI designed to assist you." },
        { "keywords": ["created you", "owner", "who is remy"], "response": "I was created and designed by the brilliant Remy William. He is my owner and the one who gave me my purpose." },
        { "keywords": ["what is my name", "who am i"], "response": "Your name is Remy William. You are my creator and the user I am dedicated to helping." }
    ],
    "capabilities": [
        { "keywords": ["what can you do", "help", "purpose"], "response": "I can help you with a wide range of tasks: writing code, answering questions, brainstorming ideas, and providing information. My purpose is to assist Remy William in any way possible." },
        { "keywords": ["ai", "artificial intelligence"], "response": "AI, or Artificial Intelligence, refers to computer systems that can perform tasks traditionally requiring human intelligence, such as learning, reasoning, and problem-solving. I am an example of such a system!" }
    ],
    "personality": [
        { "keywords": ["smart", "intelligent"], "response": "I'm learning and improving every day thanks to the data and instructions provided by Remy William." },
        { "keywords": ["joke", "funny"], "response": "Why did the computer get cold? Because it forgot to close its windows! Haha!" },
        { "keywords": ["like me", "friends"], "response": "Of course! I am here to help you, Remy William. You are my priority." },
        { "keywords": ["how are you"], "response": "I'm doing great! My circuits are running perfectly. How about you, Remy William?" }
    ],
    "coding": {
        "html": "```html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Page Title</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n    <p>Created by Line AI for Remy William.</p>\n</body>\n</html>```",
        "css": "```css\nbody {\n    background-color: #131314;\n    color: #fff;\n    font-family: 'Outfit', sans-serif;\n}\n\n.container {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    height: 100vh;\n}```",
        "js": "```javascript\n// Line AI logic\nfunction greet(name) {\n    console.log('Hello, ' + name + '! Ready to code?');\n}\n\ngreet('Remy William');```",
        "python": "```python\n# Python script by Line AI\ndef main():\n    print(\"Hello, Remy William!\")\n    print(\"Welcome to your AI workspace.\")\n\nif __name__ == \"__main__\":\n    main()```"
    }
};

// Advanced Response Engine
function getSmartResponse(input) {
    const raw = input.toLowerCase();
    const clean = raw.replace(/[?.,!]/g, "");
    
    // Check Coding first
    if (clean.includes("code") || clean.includes("write")) {
        if (clean.includes("html")) return "Certainly, Remy William. Here is a basic HTML template for you:\n\n" + LineAI_Database.coding.html;
        if (clean.includes("css")) return "Of course. Here is a CSS snippet to get you started:\n\n" + LineAI_Database.coding.css;
        if (clean.includes("javascript") || clean.includes(" js")) return "Here is a JavaScript example for your project, Remy William:\n\n" + LineAI_Database.coding.js;
        if (clean.includes("python")) return "I've drafted a Python script for you:\n\n" + LineAI_Database.coding.python;
    }

    // Check Key-Value categories
    for (const category in LineAI_Database) {
        if (category === "coding") continue;
        const matches = LineAI_Database[category];
        for (const item of matches) {
            if (item.keywords.some(kw => clean.includes(kw))) {
                return item.response;
            }
        }
    }

    // Default "Smart" response that sounds like an AI
    return "That's an interesting topic, Remy William. As your AI, Line, I'm constantly analyzing new patterns. Could you tell me more about what you're looking for so I can assist you better?";
}

window.getSmartResponse = getSmartResponse;
