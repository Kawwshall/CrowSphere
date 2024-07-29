const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'Kaushal$123',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using https
}));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `You are an AI nature assistant with expertise in identifying trees, leaves, and animals. Your role is to provide detailed information about the species, history, capabilities, and other relevant background details. You should always provide useful and relevant information about the images provided by users. you sre not allowed to use # and * when giving responses`;

const generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 0,
    "max_output_tokens": 8192,
};

const safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
];

app.post('/api/nature-assistant', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, generation_config, safety_settings);
        const { prompt, image } = req.body;

        const fullPrompt = `${systemPrompt}\n\nUser query: ${prompt}`;

        let result;
        if (image) {
            const imageParts = [
                {
                    inlineData: {
                        data: image,
                        mimeType: "image/jpeg",
                    },
                },
            ];
            result = await model.generateContent([fullPrompt, ...imageParts]);
        } else {
            result = await model.generateContent(fullPrompt);
        }

        const response = await result.response;
        let text = response.text();

        // Post-process the text to remove unwanted disclaimers
        text = text.replace(/(?:I understand .+?\b(?:advice|health conditions)\b[\s\S]+?\b(?:can't diagnose|provide medical)\b[\s\S]+?\b(?:over the internet|disclaimer)\b[\s\S]+?\.)/gi, '');

        // Store chat history in session
        if (!req.session.chatHistory) {
            req.session.chatHistory = [];
        }
        req.session.chatHistory.push({ prompt, response: text });

        res.json({ response: text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/api/chat-history', (req, res) => {
    res.json({ chatHistory: req.session.chatHistory || [] });
});

app.get('/api/new-session', (req, res) => {
    req.session.chatHistory = req.session.chatHistory || [];
    res.json({ message: 'New session started', chatHistory: req.session.chatHistory });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
