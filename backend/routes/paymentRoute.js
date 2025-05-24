import express from 'express';
import { initiateMidtransPayment, handleMidtransNotification, handleSuccessfulPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/midtrans', initiateMidtransPayment);
router.post('/midtrans/notification', handleMidtransNotification);
router.post('/midtrans/success', handleSuccessfulPayment);

export default router;
