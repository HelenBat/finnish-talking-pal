const express = require('express');
const cors = require('cors');
const app = express();

// Allow requests from your GitHub Pages URL
app.use(cors({
    origin: ['https://helenbat.github.io', 'http://localhost:3000']
}));
app.use(express.json());

// Your API key is stored as an environment variable on Render (safe!)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Finnish API is running!' });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    const { userText } = req.body;
    
    if (!userText) {
        return res.status(400).json({ error: 'No text provided' });
    }
    
    // Fallback if no API key
    if (!GEMINI_API_KEY) {
        return res.json({ 
            reply: "Hei! API key not configured yet. Add GEMINI_API_KEY in Render environment variables." 
        });
    }
    
    try {
        const prompt = `You are a Finnish language tutor. The student just said: "${userText}"

Rules:
1. Respond in Finnish
2. Keep response short (1-3 sentences)
3. If there are errors, gently correct them
4. Be encouraging
5. End with a simple follow-up question

Your response:`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150
                }
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.json({ 
                reply: `Hei! Kuulin: "${userText}". Hyvä että harjoittelet suomea!` 
            });
        }
        
        const aiReply = data.candidates[0].content.parts[0].text;
        res.json({ reply: aiReply });
        
    } catch (error) {
        console.error("Server Error:", error);
        res.json({ 
            reply: `Anteeksi, tekninen virhe. Sanoit: "${userText}". Yritä uudelleen!` 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Finnish API running on port ${PORT}`);
});