    const jwt = require('jsonwebtoken');
    const User = require('../models/User');

    exports.protect = async (req, res, next) => {
        let token;
        // Debug: print Authorization header to help troubleshoot upload issues
        console.log('authMiddleware.protect - Authorization header:', req.headers && req.headers.authorization);
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
                next();
            } catch (err) {
                res.status(401).json({ message: 'Not authorized, token failed' });
            }
        } else {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    };

    // Middleware for protecting page routes (renders, not API)
    // This reads token from localStorage via client-side, so we just render the page
    // and let client-side JS handle authentication
    exports.protectPage = async (req, res, next) => {
        // For page routes, we don't check server-side token
        // Instead, we render the page and let client-side JS (account.js) handle auth
        // by checking localStorage and redirecting if needed
        next();
    };

    exports.adminOnly = (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access only' });
        }
    };
