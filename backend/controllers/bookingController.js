import Booking from '../models/bookingModel.js';
import Room from '../models/roomModel.js';

// Get all bookings
export const getAllBookings = async (req, res) => {
    try {
        console.log('getAllBookings: Attempting to fetch all bookings');
        
        // Get all bookings without populate first to see if basic query works
        const rawBookings = await Booking.find().sort({ createdAt: -1 });
        console.log(`getAllBookings: Found ${rawBookings.length} bookings in database`);
        
        // Now try to populate with error handling for each booking
        let bookings = [];
        try {
            bookings = await Booking.find()
                .sort({ createdAt: -1 })
                .populate('room', 'name roomType price')
                .populate('user', 'name email');
                
            console.log('getAllBookings: Successfully populated bookings with room and user data');
        } catch (populateError) {
            console.error('getAllBookings: Error during populate:', populateError);
            // Fallback to raw bookings if populate fails
            bookings = rawBookings;
        }

        // Return the bookings array in a standardized format
        res.status(200).json({
            success: true,
            bookings: bookings || [] // Ensure we always return an array
        });
    } catch (error) {
        console.error('getAllBookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

// Get bookings by user ID
export const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('room', 'name roomType price images');

        res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user bookings',
            error: error.message
        });
    }
};

// Get bookings by user email
export const getUserBookingsByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email parameter is required'
            });
        }

        // Normalize email for consistent comparison
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`Finding bookings for email: ${normalizedEmail}`);
        
        // Get user by email
        const user = await import('../models/userModel.js')
            .then(module => module.default.findOne({ email: normalizedEmail }));

        if (!user) {
            console.log(`No user found with email: ${normalizedEmail}`);
            return res.status(200).json({
                success: true,
                bookings: [],
                message: 'No user found with this email'
            });
        }

        console.log(`Found user: ${user.name} (${user._id}) for email: ${normalizedEmail}`);
        
        // Get bookings by user id
        const bookings = await Booking.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate('room', 'name roomType price images');

        console.log(`Found ${bookings.length} bookings for user: ${user.name} (${user._id})`);

        res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Error in getUserBookingsByEmail:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings by email',
            error: error.message
        });
    }
};

// Create new booking
export const createBooking = async (req, res) => {
    try {
        // Check if booking with this orderId already exists
        if (req.body.paymentDetails?.orderId) {
            const existingBooking = await Booking.findOne({
                'paymentDetails.orderId': req.body.paymentDetails.orderId
            });
            
            if (existingBooking) {
                console.log('Booking with this orderId already exists:', req.body.paymentDetails.orderId);
                return res.status(200).json({
                    success: true,
                    booking: existingBooking,
                    message: 'Booking already exists'
                });
            }
        }

        const room = await Room.findById(req.body.roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Convert dates to UTC midnight
        const checkInDate = new Date(req.body.checkIn);
        const checkOutDate = new Date(req.body.checkOut);
        
        const utcCheckIn = new Date(Date.UTC(
            checkInDate.getFullYear(),
            checkInDate.getMonth(),
            checkInDate.getDate()
        ));
        
        const utcCheckOut = new Date(Date.UTC(
            checkOutDate.getFullYear(),
            checkOutDate.getMonth(),
            checkOutDate.getDate()
        ));

        // Get all rooms of this type
        const roomsOfSameType = await Room.find({ roomType: room.roomType });
        const totalRoomsOfType = roomsOfSameType.reduce((sum, r) => sum + r.totalRooms, 0);

        // Find overlapping confirmed bookings
        const confirmedBookings = await Booking.find({
            room: { $in: roomsOfSameType.map(r => r._id) },
            $and: [
                // Booking overlaps if:
                // 1. It starts before the requested checkout AND
                // 2. It ends after the requested checkin
                { checkIn: { $lt: utcCheckOut } },
                { checkOut: { $gt: utcCheckIn } },
                // AND booking is active if:
                { $or: [
                    // 1. Status = confirmed (pembayaran berhasil)
                    { status: 'confirmed' },
                    // 2. Status = checked_in
                    { status: 'checked_in' }
                ]}
            ]
        });

        // Calculate available rooms
        const confirmedRooms = confirmedBookings.length;
        const availableRooms = totalRoomsOfType - confirmedRooms;

        // Log for debugging
        console.log('Checking room availability:', {
            roomType: room.roomType,
            checkIn: utcCheckIn.toISOString(),
            checkOut: utcCheckOut.toISOString(),
            totalRoomsOfType,
            confirmedRooms,
            availableRooms,
            confirmedBookings: confirmedBookings.map(b => ({
                id: b._id,
                checkIn: b.checkIn,
                checkOut: b.checkOut,
                status: b.status
            }))
        });

        if (availableRooms <= 0) {
            return res.status(400).json({
                success: false,
                message: `No rooms of this type available for check-in date ${checkInDate.toLocaleDateString()}`
            });
        }

        // Buat booking baru
        const bookingData = {
            ...req.body,
            user: req.user._id,
            room: room._id,
            roomName: room.name,
            roomType: room.roomType
        };
        
        // Jika paymentDetails tidak dikirim dari frontend, buat default
        if (!req.body.paymentDetails) {
            bookingData.paymentDetails = {
                status: 'pending',
                method: req.body.paymentMethod || 'midtrans',
                amount: req.body.totalAmount
            };
        }
        
        // Log booking data untuk debugging
        console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
        
        const booking = await Booking.create(bookingData);

        res.status(201).json({
            success: true,
            booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
};

// Update booking status
// Handle cash payment
export const handleCashPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { amount } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Update booking with cash payment details
        booking.paymentDetails = {
            status: 'pending',
            method: 'cash',
            amount: amount
        };
        booking.status = 'pending';
        await booking.save();

        res.json({
            success: true,
            message: 'Cash payment recorded successfully'
        });
    } catch (error) {
        console.error('Error handling cash payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process cash payment'
        });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.status = req.body.status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
            error: error.message
        });
    }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Only allow cancellation of pending or confirmed bookings
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel this booking'
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

// Get booking details
export const getBookingDetails = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('room', 'name roomType price images amenities')
            .populate('user', 'name email phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking details',
            error: error.message
        });
    }
};
