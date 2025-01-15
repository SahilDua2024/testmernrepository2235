const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat'); // Import Chat model
const User = require('../models/User');
const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
    const { userInput } = req.body;
    const { userId } = req.user; // Get authenticated user's ID

    try {
        // Normalize input to lowercase for better matching
        const normalizedInput = userInput.trim().toLowerCase();

        // Dummy chatbot responses
        const dummyResponses = {
            hello: 'Hi there!',
            hi: 'Hello! How can I help you?',
            how: 'I am just a bot, but I am doing great!',
            bye: 'Goodbye! Have a great day!',
        };

        // Generate a response based on the user's input
        const botResponse = dummyResponses[normalizedInput] || 'Sorry, I did not understand that.';

        // Save the chat conversation in the database
        const chat = new Chat({
            userId,               // Authenticated user's ID
            userMessage: userInput, // User's input from the frontend
            botResponse,          // Dummy response
        });

        await chat.save();

        // Send the bot response back to the user
        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error in chatbot route:', error);
        res.status(500).json({ error: 'Failed to process chatbot message' });
    }
});

module.exports = router;
