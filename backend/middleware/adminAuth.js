import jwt from "jsonwebtoken";

/**
 * Simplified admin authentication middleware
 * This middleware only checks if the JWT token is valid and present
 * It does not verify against any admin email or role
 */
const adminAuth = async (req, res, next) => {
  try {
    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      console.log('No auth header or not Bearer token');
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('No token after split');
      return res.status(401).json({
        success: false,
        message: "Not Authorized Login Again",
      });
    }

    // Just verify the token is valid, don't check admin status
    // This allows any valid JWT token to access admin routes
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add decoded user info to request for potential later use
    req.user = { id: decoded.id };
    
    // Allow access to any authenticated user
    console.log('Admin auth passed for user ID:', decoded.id);
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ 
      success: false, 
      message: "Authentication failed: " + error.message 
    });
  }
};

export default adminAuth;
