// Middleware: authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    console.log(`\n[AUTH MIDDLEWARE] Processing ${req.method} ${req.path}`);
    
    const authHeader = req.header('Authorization');
    console.log('[AUTH MIDDLEWARE] Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'Not provided');
    
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        console.log('[AUTH MIDDLEWARE] No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'default_jwt_secret';
        console.log('[AUTH MIDDLEWARE] Using JWT_SECRET:', secret.substring(0, 15) + '...');
        
        const decoded = jwt.verify(token, secret);
        console.log('[AUTH MIDDLEWARE] Token verified successfully. User ID:', decoded.id);
        
        // Try to fetch user from database, but don't fail if MongoDB is unavailable
        let user = null;
        try {
            user = await User.findById(decoded.id).lean();
            if (user) {
                console.log('[AUTH MIDDLEWARE] User found:', { id: user._id, name: user.name, role: user.role });
            } else {
                console.log('[AUTH MIDDLEWARE] User not found in database for ID:', decoded.id);
                // Still allow the request to proceed with limited user info
                console.log('[AUTH MIDDLEWARE] Proceeding with JWT-decoded user info only');
            }
        } catch (dbError) {
            console.error('[AUTH MIDDLEWARE] Database error:', dbError.message);
            console.log('[AUTH MIDDLEWARE] Database unavailable, proceeding with JWT-decoded user info');
        }
        
        // Set req.user with available data (from DB if available, from JWT if not)
        req.user = {
            id: decoded.id,
            name: user?.name || 'User',
            email: user?.email || '',
            role: user?.role || decoded.role || 'unknown',
            phone: user?.phone || ''
        };
        
        console.log('[AUTH MIDDLEWARE] req.user set:', { id: req.user.id, role: req.user.role });
        
        next();
    } catch (error) {
        console.error('[AUTH MIDDLEWARE] JWT Error:', error.name, '-', error.message);
        console.error('[AUTH MIDDLEWARE] Token received:', token.substring(0, 30) + '...');
        res.status(401).json({ message: 'Invalid token', details: error.message });
    }
};

module.exports = authMiddleware;