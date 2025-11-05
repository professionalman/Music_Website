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

    exports.adminOnly = (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access only' });
        }
    };
