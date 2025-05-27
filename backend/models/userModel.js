import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    googleId: { type: String },
    picture: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    address: { type: String },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    minimize: false 
})

const userModel = mongoose.models.user || mongoose.model("user", userSchema)

export default userModel