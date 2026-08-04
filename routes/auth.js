const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
    const { username, password } = req.body;

    const validUsername = process.env.ADMIN_USERNAME || 'ezechiel';
    const validPassword = process.env.ADMIN_PASSWORD || 'ezechiel123';

    if (username === validUsername && password === validPassword) {
        const secret = process.env.JWT_SECRET || 'cinestream_super_secret_jwt_key_2026';
        const token = jwt.sign({ username, isAdmin: true, loginTime: new Date() },
            secret, { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            message: 'Admin login successful',
            token,
            admin: { username }
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Invalid Admin credentials! Check username and password.'
    });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.json({ authenticated: false });
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    try {
        const secret = process.env.JWT_SECRET || 'cinestream_super_secret_jwt_key_2026';
        const decoded = jwt.verify(token, secret);
        return res.json({ authenticated: true, admin: decoded });
    } catch (e) {
        return res.json({ authenticated: false });
    }
});

module.exports = router;