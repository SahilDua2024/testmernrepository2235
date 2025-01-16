const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const chatHistoryRoutes = require('./routes/chatHistoryRoutes');
require('dotenv').config();
const app = express();
const cors = require('cors');

app.use(cors({
    origin: 'https://mernproj-fdb92.web.app', // Replace with your Firebase URL
    credentials: true, // Include credentials if needed (e.g., cookies)
}));
app.use(express.json());
app.get('/ping', (req, res) => {
    res.json({ message: 'Server is up and running' });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api', chatbotRoutes);
app.use('/api',chatHistoryRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
