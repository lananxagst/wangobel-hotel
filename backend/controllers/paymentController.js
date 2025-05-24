import midtransClient from 'midtrans-client';
import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';

// Check if Midtrans credentials are available
if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY || !process.env.MIDTRANS_MERCHANT_ID) {
    throw new Error('Midtrans credentials are not configured');
}

// Create Snap API instance
const snap = new midtransClient.Snap({
    isProduction: false, // Set to false for sandbox testing
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    merchantId: process.env.MIDTRANS_MERCHANT_ID
});

// Create Core API instance for notification handling
const core = new midtransClient.CoreApi({
    isProduction: false, // Set to false for sandbox testing
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    merchantId: process.env.MIDTRANS_MERCHANT_ID
});

// Initialize Midtrans payment
// Initialize Midtrans payment
export const initiateMidtransPayment = async (req, res) => {
    try {
        console.log('Received payment request:', req.body);

        const { bookingId, amount, customerDetails } = req.body;

        // Validate required fields
        if (!bookingId) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing bookingId' 
            });
        }

        if (!amount) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing amount' 
            });
        }

        if (!customerDetails || !customerDetails.firstName || !customerDetails.email || !customerDetails.phone) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing or invalid customer details' 
            });
        }

        // Create transaction details
        const orderId = `BOOK-${Date.now()}`;
        console.log('Creating transaction with order ID:', orderId);

        const transactionDetails = {
            transaction_details: {
                order_id: orderId,
                gross_amount: parseInt(amount)
            },
            credit_card: {
                secure: true
            },
            customer_details: {
                first_name: customerDetails.firstName,
                last_name: customerDetails.lastName,
                email: customerDetails.email,
                phone: customerDetails.phone
            },
            enabled_payments: [
                "credit_card",        // Kartu kredit
                "bca_va",            // BCA Virtual Account
                "bri_va",            // BRI Virtual Account
                "bni_va",            // BNI Virtual Account
                "permata_va",        // Permata Virtual Account
                "echannel",          // Mandiri Bill Payment
                "other_va",          // VA Bank lain
                "gopay",             // GoPay
                "shopeepay"          // ShopeePay
            ],
            callbacks: {
                finish: `${process.env.FRONTEND_URL}/payment-status/success`,
                error: `${process.env.FRONTEND_URL}/payment-status/error`,
                pending: `${process.env.FRONTEND_URL}/payment-status/pending`
            }
        };

        console.log('Creating transaction with details:', transactionDetails);

        try {
            const transactionToken = await snap.createTransaction(transactionDetails);
            console.log('Transaction token created:', transactionToken.token);

            res.status(200).json({
                success: true,
                token: transactionToken.token,
                orderId: orderId
            });
        } catch (snapError) {
            console.error('Midtrans Snap error:', snapError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create Midtrans transaction',
                error: snapError.message
            });
        }
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate payment',
            error: error.message,
            details: error.response?.data || error
        });
    }
};

// Handle successful payment from frontend
export const handleSuccessfulPayment = async (req, res) => {
    try {
        const { bookingId, orderId, transactionId, grossAmount } = req.body;

        if (!bookingId || !orderId || !transactionId || !grossAmount) {
            console.error('Missing required fields:', { bookingId, orderId, transactionId, grossAmount });
            return res.status(400).json({
                success: false,
                message: 'Missing required payment information'
            });
        }

        console.log('Processing successful payment:', {
            bookingId,
            orderId,
            transactionId,
            grossAmount
        });

        // Verify the booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.error('Booking not found:', bookingId);
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if payment was already processed
        if (booking.status === 'confirmed') {
            console.log('Booking already confirmed:', bookingId);
            return res.json({
                success: true,
                message: 'Booking was already confirmed'
            });
        }

        // Update booking status and payment details
        booking.status = 'confirmed';
        booking.paymentDetails = {
            method: 'midtrans',
            transactionId: transactionId,
            orderId: orderId,
            amount: parseFloat(grossAmount),
            updatedAt: new Date()
        };

        try {
            // Save the booking
            await booking.save();
            console.log('Booking updated successfully:', bookingId);

            return res.json({
                success: true,
                message: 'Booking confirmed successfully',
                booking: {
                    id: booking._id,
                    status: booking.status,
                    paymentDetails: booking.paymentDetails
                }
            });
        } catch (saveError) {
            console.error('Error saving booking:', saveError);
            return res.status(500).json({
                success: false,
                message: 'Failed to save booking',
                error: saveError.message
            });
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Handle Midtrans notification
export const handleMidtransNotification = async (req, res) => {
    try {
        console.log('Received Midtrans notification:', req.body);
        const notification = req.body;

        // Verify notification from Midtrans
        let verifiedNotification;
        try {
            verifiedNotification = await core.transaction.notification(notification);
            console.log('Verified Midtrans notification:', verifiedNotification);
        } catch (error) {
            console.error('Error verifying Midtrans notification:', error);
            return res.status(403).json({ 
                success: false,
                message: 'Invalid notification',
                error: error.message 
            });
        }

        // Extract transaction details
        const orderId = verifiedNotification.order_id;
        const transactionStatus = verifiedNotification.transaction_status;
        const fraudStatus = verifiedNotification.fraud_status;
        const transactionId = verifiedNotification.transaction_id;
        const grossAmount = verifiedNotification.gross_amount;
        const paymentType = verifiedNotification.payment_type;

        console.log('Processing transaction:', {
            orderId,
            transactionStatus,
            fraudStatus,
            transactionId,
            grossAmount,
            paymentType
        });

        // Extract booking ID from order ID (format: BOOK-{bookingId}-{timestamp})
        const bookingIdMatch = orderId.match(/BOOK-(.*?)-/);
        if (!bookingIdMatch) {
            console.error('Invalid order ID format:', orderId);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid order ID format' 
            });
        }

        const bookingId = bookingIdMatch[1];
        console.log('Looking for booking:', bookingId);

        // Find booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.error('Booking not found:', bookingId);
            return res.status(404).json({ 
                success: false,
                message: 'Booking not found' 
            });
        }

        // Determine booking status based on Midtrans status
        let bookingStatus;
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'challenge') {
                bookingStatus = 'pending';
            } else if (fraudStatus === 'accept' || !fraudStatus) {
                bookingStatus = 'confirmed';
            }
        } else if (transactionStatus === 'cancel' || 
                  transactionStatus === 'deny' || 
                  transactionStatus === 'expire') {
            bookingStatus = 'cancelled';
        } else if (transactionStatus === 'pending') {
            bookingStatus = 'pending';
        } else {
            console.warn('Unknown transaction status:', transactionStatus);
            bookingStatus = 'pending';
        }

        console.log('Updating booking:', {
            bookingId,
            currentStatus: booking.status,
            newStatus: bookingStatus,
            amount: grossAmount
        });

        // Update booking
        booking.status = bookingStatus;
        if (!booking.paymentDetails) {
            booking.paymentDetails = {
                method: 'midtrans',
                transactionId: transactionId,
                amount: grossAmount,
                paymentType: paymentType
            };
        } else {
            booking.paymentDetails.transactionId = transactionId;
            booking.paymentDetails.amount = grossAmount;
            booking.paymentDetails.paymentType = paymentType;
        }

        // Save changes
        try {
            await booking.save();
            console.log('Booking updated successfully:', booking._id);
        } catch (saveError) {
            console.error('Error saving booking:', saveError);
            throw saveError;
        }

        res.status(200).json({ 
            success: true,
            message: 'Notification handled',
            bookingStatus: bookingStatus
        });
    } catch (error) {
        console.error('Error handling Midtrans notification:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing notification',
            error: error.message
        });
    }
};
