import Booking from '../models/bookingModel.js';
import Room from '../models/roomModel.js';
import mongoose from 'mongoose';

// Handle cash payment
export const processCashPayment = async (req, res) => {
    try {
        // Debug entire request body
        console.log('Cash payment request body:', JSON.stringify(req.body));
        console.log('User from request:', req.user);
        
        const { bookingId, amount, customerDetails, roomId, checkIn, checkOut, numberOfGuests, totalAmount } = req.body;
        
        // Validate required fields
        if (!roomId) {
            console.error('Missing required field: roomId');
            return res.status(400).json({
                success: false,
                message: 'Missing required field: roomId'
            });
        }
        
        if (!checkIn || !checkOut) {
            console.error('Missing required fields: checkIn or checkOut');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: checkIn or checkOut'
            });
        }
        
        if (!customerDetails) {
            console.error('Missing required field: customerDetails');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: customerDetails'
            });
        }
        
        console.log('Processing cash payment for booking data:', { 
            bookingId, 
            roomId, 
            checkIn, 
            checkOut,
            customerDetails 
        });

        // Check if room exists
        const room = await Room.findById(roomId);
        if (!room) {
            console.error('Room not found:', roomId);
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Prepare user ID from request
        const userId = req.user ? req.user._id : null;
        if (!userId) {
            console.error('User not authenticated');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Create a new booking with cash payment details
        const newBooking = new Booking({
            user: userId,
            room: roomId,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            numberOfGuests: numberOfGuests || 1,
            guestName: customerDetails.firstName + ' ' + (customerDetails.lastName || ''),
            guestEmail: customerDetails.email,
            guestPhone: customerDetails.phone,
            totalAmount: totalAmount || amount || 0,
            status: 'confirmed',
            paymentDetails: {
                method: 'cash',
                amount: amount || 0,
                status: 'Pay at Hotel',
                paymentType: 'cash_on_arrival'
            }
        });
        
        console.log('New booking created:', newBooking);

        // Save the new booking
        try {
            await newBooking.save();
            console.log('Cash payment booking created:', newBooking._id);

            res.status(200).json({
                success: true,
                message: 'Cash payment recorded successfully',
                booking: newBooking
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
        console.error('Error processing cash payment:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to process cash payment',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
