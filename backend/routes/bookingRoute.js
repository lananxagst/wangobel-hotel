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
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/user/:userId', protect, getUserBookings);
router.get('/user-email/:email', protect, getUserBookingsByEmail);
router.get('/:id', protect, getBookingDetails);
router.post('/', protect, createBooking);
router.patch('/:id/cancel', protect, cancelBooking);
router.post('/:bookingId/payment', protect, handleCashPayment);

// Admin routes
router.get('/', protect, admin, getAllBookings);
router.patch('/:id/status', protect, admin, updateBookingStatus);

export default router;
