const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');
app.use('/api/habits', habitRoutes);
app.use('/api/auth', authRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Planora Habit Tracker API is running.');
});

// Start Server Immediately
app.listen(PORT, () => {
  console.log(`>>> Planora API Server is running on port ${PORT}`);
});

// Database Connection in background (non-blocking)
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planora';

console.log('>>> Connecting to MongoDB...');
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000 // Fast fail in 5 seconds if MongoDB is down
})
  .then(() => {
    console.log('>>> MongoDB Connected Successfully to:', mongoURI);
  })
  .catch(err => {
    console.error('!!! MongoDB Connection Failed:', err.message);
    console.log('>>> Running in Offline Fallback Mode. Data will be saved locally by the frontend client.');
  });
// Trigger nodemon reload

