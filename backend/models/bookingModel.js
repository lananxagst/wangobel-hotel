import mongoose from 'mongoose';

const generateBookingId = () => {
    return `BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true,
        default: generateBookingId
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    guestName: {
        type: String,
        required: true
    },
    guestEmail: {
        type: String,
        required: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    guestPhone: {
        type: String,
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'],
        default: 'pending'
    },
    paymentDetails: {
        method: {
            type: String,
            enum: ['cash', 'midtrans'],
            default: 'midtrans'
        },
        orderId: String,
        transactionId: String,
        amount: Number,
        updatedAt: Date
    },
    specialRequests: {
        type: String
    },
    roomName: {
        type: String,
        required: true
    },
    roomType: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Add validation for check-in and check-out dates
bookingSchema.pre('save', function(next) {
    if (this.checkIn >= this.checkOut) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
