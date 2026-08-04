const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const movieRoutes = require('./routes/movies');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = app.get('env') === 'production';

app.disable('x-powered-by');

// Enable CORS (restrictable via CORS_ORIGIN env in production)
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: blob: https:; " +
        "media-src 'self' blob: https:; " +
        "connect-src 'self' https:"
    );
    next();
});

// JSON and form body parsers (capped payloads)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: isProd ? '7d' : 0
}));

// API Routes
app.use('/api/movies', movieRoutes);
app.use('/api/auth', authRoutes);

// Healthcheck Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        system: 'CineStream Movie Platform API',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.round(process.uptime()),
        database: db.isFallback() ? 'JSON Fallback Storage' : 'MySQL Database Engine',
        timestamp: new Date()
    });
});

// JSON 404 for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback to index.html for SPA routes (non-API)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// JSON syntax error handler (malformed request bodies)
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start DB & Express Server
async function startServer() {
    await db.initDB();
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🎬 CineStream Full-Stack Platform Server Started!`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`🗄️  Database: ${db.isFallback() ? 'JSON Fallback Storage' : 'MySQL Database Engine'}`);
        console.log(`🔒 Admin Login: username "${process.env.ADMIN_USERNAME || 'ezechiel'}"`);
        console.log(`====================================================`);
    });
}

startServer();
