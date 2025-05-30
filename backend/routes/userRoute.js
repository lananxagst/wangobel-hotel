import express from "express"
import { adminLogin, loginUser, registerUser, createAdmin, googleLogin, getUserProfile, updateUserProfile, uploadUserPhoto, forgotPassword, resetPassword } from "../controllers/userController.js"
import { authenticateToken } from "../middleware/auth.js"

const userRouter = express.Router()

// Public routes
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/google-login', googleLogin)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password', resetPassword)

// Protected routes
userRouter.get('/profile', authenticateToken, getUserProfile)
userRouter.put('/profile', authenticateToken, updateUserProfile)
userRouter.post('/upload-photo', authenticateToken, uploadUserPhoto)

// Admin routes
userRouter.post('/admin/login', adminLogin)
userRouter.post('/admin/create', createAdmin) // This should be called only once to create initial admin

export default userRouter