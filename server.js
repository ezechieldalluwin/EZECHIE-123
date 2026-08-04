const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const movieRoutes = require('./routes/movies');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/movies', movieRoutes);
app.use('/api/auth', authRoutes);

// Healthcheck Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        system: 'CineStream Movie Platform API',
        database: db.isFallback() ? 'JSON Fallback Storage' : 'MySQL Database Engine',
        timestamp: new Date()
    });
});

// Fallback to index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start DB & Express Server
async function startServer() {
    await db.initDB();
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🎬 CineStream Full-Stack Platform Server Started!`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`🔒 Admin Login Credentials:`);
        console.log(`   Username: ${process.env.ADMIN_USERNAME || 'ezechiel'}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'ezechiel123'}`);
        console.log(`====================================================`);
    });
}

startServer();