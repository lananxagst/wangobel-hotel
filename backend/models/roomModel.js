import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    totalRooms: {
        type: Number,
        default: 5,
        required: true,
        min: 1
    },
    amenities: [{
        type: String
    }],
    images: [{
        public_id: String,
        url: String
    }],
    roomType: {
        type: String,
        required: true,
        enum: ['Executive', 'Deluxe', 'Suite']
    },
    status: {
        type: String,
        enum: ['available', 'maintenance'],
        default: 'available'
    },
    featured: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    reviews: [reviewSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate average rating before saving
roomSchema.pre('save', function(next) {
    if (this.reviews.length > 0) {
        this.rating = this.reviews.reduce((acc, review) => acc + review.rating, 0) / this.reviews.length;
        this.numReviews = this.reviews.length;
    }
    next();
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
