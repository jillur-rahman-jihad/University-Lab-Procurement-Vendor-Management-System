// Middleware: authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    console.log(`\n[AUTH MIDDLEWARE] Processing ${req.method} ${req.path}`);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        console.log('[AUTH MIDDLEWARE] No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'default_jwt_secret';
        const decoded = jwt.verify(token, secret);
        console.log('[AUTH MIDDLEWARE] Token decoded:', decoded.id);
        
        // Fetch user from database to get role and other info
        const user = await User.findById(decoded.id).lean();
        if (!user) {
            console.log('[AUTH MIDDLEWARE] User not found for ID:', decoded.id);
            return res.status(401).json({ message: 'User not found' });
        }
        
        console.log('[AUTH MIDDLEWARE] User found:', { id: user._id, name: user.name, role: user.role });
        
        // Set req.user with all necessary data
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        };
        
        console.log('[AUTH MIDDLEWARE] req.user set:', req.user);
        console.log('[AUTH MIDDLEWARE] Calling next()');
        
        next();
    } catch (error) {
        console.log('[AUTH MIDDLEWARE] Error:', error.message);
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;