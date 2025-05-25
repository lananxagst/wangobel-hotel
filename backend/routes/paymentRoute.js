import express from 'express';
import { initiateMidtransPayment, handleMidtransNotification, handleSuccessfulPayment } from '../controllers/paymentController.js';
import { processCashPayment } from '../controllers/cashPaymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Midtrans payment routes
router.post('/midtrans', protect, initiateMidtransPayment);
router.post('/midtrans/notification', handleMidtransNotification);
router.post('/midtrans/success', protect, handleSuccessfulPayment);

// Cash payment route
router.post('/cash', protect, processCashPayment);

export default router;
