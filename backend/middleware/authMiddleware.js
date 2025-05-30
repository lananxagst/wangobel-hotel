import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect routes
export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin middleware - simplified to only check against admin email in .env
export const admin = (req, res, next) => {
    // Check if the user's email matches the admin email in .env
    // This is the ONLY condition for admin access
    if (req.user && req.user.email === process.env.ADMIN_EMAIL) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as admin' });
    }
};
