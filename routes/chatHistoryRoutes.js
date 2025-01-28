const express = require('express');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat'); // Import Chat model
const router = express.Router();

// Middleware to authenticate JWT token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Ensure `id` matches the payload
        console.log(req.user);
        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};

router.get('/chatbot/history', authenticate, async (req, res) => {
    console.log('Route req.user:', req.user); // Log req.user
    const userId = req.user.userId; 
    console.log('User ID is:', userId);

    if (!userId) {
        return res.status(400).json({ error: 'User ID missing from token' });
    }

    try {
        const chats = await Chat.find({userId});
        console.log('Chats now tested in chat history route: ', chats);
        res.json(chats);
    } catch (error) {
        console.error('Chat History Error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

module.exports = router;
