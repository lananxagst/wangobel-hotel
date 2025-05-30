import express from 'express';
import {
    getAllBookings,
    getUserBookings,
    getUserBookingsByEmail,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    getBookingDetails,
    handleCashPayment
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/user/:userId', protect, getUserBookings);
router.get('/user-email/:email', protect, getUserBookingsByEmail);
router.get('/:id', protect, getBookingDetails);
router.post('/', protect, createBooking);
router.patch('/:id/cancel', protect, cancelBooking);
router.post('/:bookingId/payment', protect, handleCashPayment);

// Admin routes
router.get('/', adminAuth, getAllBookings);
router.patch('/:id/status', adminAuth, updateBookingStatus);

export default router;
