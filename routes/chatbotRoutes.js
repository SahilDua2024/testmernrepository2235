require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat'); // Import Chat model
const User = require('../models/User');
const router = express.Router();
const OpenAI = require('openai');
const key = process.env.OPENAI_API_KEY;
console.log(key);
// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.trim(), // Trim to remove unnecessary spaces or newlines
});

//console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);

// Middleware to authenticate JWT token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
       
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Chatbot route (stores chats in DB)
// Chatbot route (dummy response logic)
   router.post('/chatbot', authenticate, async (req, res) => {
    const { message } = req.body;
    const { userId } = req.user; // Get authenticated user's ID
    //const { message } = req.body;
    console.log(req.body);
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Specify model
            messages: [ { role: "system", content: "You are a helpful tutor who explains tax refund concepts." },
              { role: "user", content: message},], // User's message
            temperature: 1,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        // Extract and return the chatbot's reply
        const reply = response.choices[0].message.content;
        const cleanResponse = reply.replace(/[^a-zA-Z0-9 .,!?]/g, ""); 
        const chat = new Chat({
            userId,               // Authenticated user's ID
            userMessage: message, // User's input from the fro
            botResponse: cleanResponse
        });
        await chat.save();
        reply = cleanResponse;
        res.json({ cleanResponse });
        console.log(cleanResponse);
    
    } catch (error) {
        console.error('Error in chatbot route:', error);
        res.status(500).json({ error: 'Failed to process chatbot message' });
    }
});

module.exports = router;
