import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isTokenExpired } from '../isTokenExpired';
import api from '../api';

const Chatbot = () => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]); // Interleaved chat history
    const [isTyping, setIsTyping] = useState(false); // Typing indicator
    const [isRecording, setIsRecording] = useState(false); // Speech recognition state
    const chatRef = useRef(null); // Reference for scrolling
    const [conversation, setConversation] = useState([]); // Conversation history
    const recognition = useRef(null); // Reference for speech recognition object
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;
    // Fetch chat history from MongoDB when the component mounts
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || isTokenExpired(token)) {
            alert('Please login first');
            navigate('/login'); // Redirect to login if not authenticated
            return;
        }

        api.get(`${apiUrl}/api/chatbot/history`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => {
                console.log('Chat history:', response.data);

                // Interleave userMessage and botResponse sequentially
                const interleavedHistory = [];
                response.data.forEach((entry) => {
                    if (entry.userMessage) {
                        interleavedHistory.push({
                            role: 'user',
                            content: entry.userMessage,
                            timestamp: entry.timestamp,
                        });
                    }
                    if (entry.botResponse) {
                        interleavedHistory.push({
                            role: 'assistant',
                            content: entry.botResponse,
                            timestamp: entry.timestamp,
                        });
                    }
                });

                setChatHistory(interleavedHistory); // Set interleaved history
            })
            .catch((err) => {
                console.error('Error fetching chat history:', err);
            });
    }, [navigate]);

    // Automatically scroll to the bottom when a new message is added
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [chatHistory]);
      // Initialize Speech Recognition
      useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition.current = new SpeechRecognition();
            recognition.current.lang = 'en-US'; // Set language
            recognition.current.interimResults = false; // Only process final results
            recognition.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setMessage(transcript); // Update input field with the recognized speech
            };
            recognition.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        } else {
            console.warn('Speech Recognition API is not supported in this browser.');
        }
    }, []);

    // Automatically scroll to the bottom when a new message is added
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [conversation]);

    // Text-to-Speech for chatbot responses
    const speak = (text) => {
        const synth = window.speechSynthesis;
        if (!synth) {
            console.warn('Text-to-Speech is not supported in this browser.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Set language
        utterance.rate = 1; // Adjust speed (1 is normal)
        utterance.pitch = 1; // Adjust pitch (1 is normal)
        synth.speak(utterance);
    };
    // Handle Message Sending
    const handleSend = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first');
            navigate('/login'); // Redirect to login if not authenticated
            return;
        }

        if (!message.trim()) return; // Prevent sending empty messages

        // Add user message to chat history
        const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
        setChatHistory((prev) => [...prev, userMessage]);
        setIsTyping(true); // Show "typing..." indicator


        try {
            const res = await axios.post(
                `${apiUrl}/api/chatbot`,
                { message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const reply = res.data.reply;

            // Add chatbot reply to chat history
            const botResponse = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
            setChatHistory((prev) => [...prev, botResponse]);
            speak(reply);
        } catch (err) {
            console.error('Error:', err);
            setChatHistory((prev) => [
                ...prev,
                { role: 'assistant', content: 'Error connecting to the server.', timestamp: new Date().toISOString() },
            ]);
        } finally {
            setMessage(''); // Clear input field
            setIsTyping(false); // Hide "typing..." indicator
        }
    };
    // Start Speech Recognition
    const startSpeechRecognition = () => {
        if (recognition.current) {
            setIsRecording(true);
            recognition.current.start();
        } else {
            alert('Speech Recognition is not supported in this browser.');
        }
    };

    // Stop Speech Recognition
    const stopSpeechRecognition = () => {
        if (recognition.current) {
            setIsRecording(false);
            recognition.current.stop();
        }
    };

    return (
        <div style={{ padding: '20px'}}>
            <h1>Interactive Chatbot</h1>

            {/* Chat Container */}
            <div
                ref={chatRef}
                style={{
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    padding: '20px',
                    maxWidth: '600px',
                    margin: '0 auto',
                    height: '400px',
                    overflowY: 'auto',
                    backgroundColor: '#f9f9f9',
                }}
            >
                {chatHistory.map((entry, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                        <div
                            style={{
                                textAlign: entry.role === 'user' ? 'right' : 'left',
                                marginBottom: '5px',
                                color: entry.role === 'user' ? '#555' : '#000',
                                backgroundColor: entry.role === 'user' ? '#d1e7dd' : '#f8d7da',
                                padding: '10px',
                                borderRadius: '10px',
                                display: 'inline-block',
                                maxWidth: '75%',
                            }}
                        >
                            <strong>{entry.role === 'user' ? 'You' : 'Bot'}:</strong> {entry.content}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', textAlign: entry.role === 'user' ? 'right' : 'left' }}>
                            <em>{new Date(entry.timestamp).toLocaleString()}</em>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div style={{ textAlign: 'left', marginTop: '10px' }}>
                        <em>Chatbot is typing...</em>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{ marginTop: '20px' }}>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="3"
                    cols="50"
                    placeholder="Type your message here..."
                    style={{
                        resize: 'none',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        width: '100%',
                        maxWidth: '600px',
                    }}
                ></textarea>
                <br />
                <button
                    type="submit"
                    style={{
                        marginTop: '10px',
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Send
                </button>
                <button
                        type="button"
                        onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                        style={{
                            padding: '10px 20px',
                            marginLeft: '10px',
                            border: 'none',
                            backgroundColor: isRecording ? '#dc3545' : '#28a745',
                            color: '#fff',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
            </form>
        </div>
    );
};

export default Chatbot;
