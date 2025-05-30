import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { cloudinary } from '../config/cloudinary.js';
import multer from 'multer';
import { sendPasswordResetEmail } from '../utils/emailService.js';

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('file');

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}


// CONTROLLER FUNCTION FOR USER LOGIN
const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid Credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// CONTROLLER FUNCTION FOR USER REGISTER
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        
        // Validate input data
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Please provide name, email, and password" })
        }
        
        // CHECKING IF USER ALREADY EXISTS
        const exists = await userModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }
        
        // VALIDATE EMAIL FORMAT
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        
        // VALIDATE PASSWORD STRENGTH
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" })
        }

        // HASHING USER PASSWORD
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create default avatar using user's name
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            picture: avatarUrl
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        // Return user info along with token
        res.json({ 
            success: true, 
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}


// CONTROLLER FUNCTION FOR ADMIN LOGIN
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body

        // Find admin user
        const admin = await userModel.findOne({ email, isAdmin: true })
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid admin credentials" 
            })
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password)
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid admin credentials" 
            })
        }

        // Create token
        const token = createToken(admin._id)
        res.json({ 
            success: true, 
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                isAdmin: admin.isAdmin
            }
        })
    } catch (error) {
        console.error("Admin login error:", error)
        res.status(500).json({ 
            success: false, 
            message: "Error during admin login" 
        })
    }
}

// Create initial admin user
const createAdmin = async (req, res) => {
    try {
        const adminExists = await userModel.findOne({ isAdmin: true })
        if (adminExists) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists"
            })
        }

        // Create admin using environment variables
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASS, salt)

        const admin = await userModel.create({
            name: "Admin",
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            isAdmin: true
        })

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        })
    } catch (error) {
        console.error("Create admin error:", error)
        res.status(500).json({
            success: false,
            message: "Error creating admin user"
        })
    }
}

// CONTROLLER FUNCTION FOR GOOGLE LOGIN
const googleLogin = async (req, res) => {
    try {
        const { email, name, googleId, picture } = req.body

        // Check if user exists
        let user = await userModel.findOne({ email })

        if (!user) {
            // Create new user if doesn't exist
            user = await userModel.create({
                name,
                email,
                googleId,
                picture,
                password: bcrypt.hashSync(googleId + process.env.JWT_SECRET, 10) // Create secure random password
            })
        } else {
            // Update existing user's Google ID if they don't have it
            // But don't override existing picture if user has customized it
            if (!user.googleId) {
                user.googleId = googleId
                // Only set picture from Google if user doesn't have a picture yet
                if (!user.picture) {
                    user.picture = picture
                }
                await user.save()
            }
        }

        // Create token and send response with user data
        const token = createToken(user._id)
        
        // Return current user data from database (including the most recent picture)
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            picture: user.picture
        }
        
        res.json({ 
            success: true, 
            token,
            user: userData
        })

    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

// CONTROLLER FUNCTION TO GET USER PROFILE
const getUserProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('-password')
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }
        res.json({ success: true, user })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// CONTROLLER FUNCTION TO UPDATE USER PROFILE
const updateUserProfile = async (req, res) => {
    try {
        const { name, phone, address, picture } = req.body
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        // Update fields if provided
        if (name) user.name = name
        if (phone) user.phone = phone
        if (address) user.address = address
        if (picture) user.picture = picture

        await user.save()

        // Return updated user without password
        const updatedUser = await userModel.findById(user._id).select('-password')
        res.json({ success: true, user: updatedUser })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// Controller function to handle photo upload
const uploadUserPhoto = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: 'File upload error' });
        } else if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            // Convert buffer to base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'wangobel/profiles',
                use_filename: true
            });

            res.json({
                success: true,
                secure_url: result.secure_url
            });
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            res.status(500).json({ success: false, message: 'Error uploading image' });
        }
    });
};

// CONTROLLER FUNCTION FOR FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            // For security reasons, don't reveal if email exists or not
            return res.json({ success: true, message: "If your email is registered, you will receive a password reset link" });
        }

        // Generate reset token
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Save reset token to user document with expiry
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send password reset email
        const emailSent = await sendPasswordResetEmail(email, resetToken);
        
        if (!emailSent) {
            return res.json({ 
                success: false, 
                message: "Failed to send password reset email. Please try again later." 
            });
        }
        
        // Log for debugging
        console.log(`Reset token for ${email}: ${resetToken}`);

        // Return success message
        res.json({ 
            success: true, 
            message: "If your email is registered, you will receive a password reset link",
            // In development, also return the token and reset URL for testing
            // These should be removed in production
            devInfo: {
                resetToken,
                resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
            }
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.json({ success: false, message: error.message });
    }
};

// CONTROLLER FUNCTION FOR RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        
        console.log('Reset password request received with token:', token);

        // Validate password
        if (!password || password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully:', decoded);
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.json({ success: false, message: "Invalid or expired token" });
        }

        // Find user with token and check expiry
        const user = await userModel.findOne({
            _id: decoded.id,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        console.log('User found by token:', user ? 'Yes' : 'No');

        if (!user) {
            return res.json({ success: false, message: "Invalid or expired token" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        console.log('Password reset successful for user:', user.email);

        // Return success
        res.json({ success: true, message: "Password has been reset successfully" });

    } catch (error) {
        console.error('Reset password error:', error);
        res.json({ success: false, message: error.message });
    }
};

export {
    registerUser,
    loginUser,
    googleLogin,
    getUserProfile,
    updateUserProfile,
    uploadUserPhoto,
    adminLogin,
    createAdmin,
    forgotPassword,
    resetPassword
}
