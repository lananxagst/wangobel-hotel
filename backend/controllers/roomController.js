import Room from '../models/roomModel.js';
import Booking from '../models/bookingModel.js';
import { cloudinary } from '../config/cloudinary.js';
import Subscriber from '../models/subscriberModel.js';
import { sendRoomUpdateEmail } from '../utils/emailService.js';

// Get all rooms
export const getRooms = async (req, res) => {
    try {
        // Get query parameters
        const { checkIn, checkOut } = req.query;
        
        // Get all rooms
        const rooms = await Room.find({}).lean();

        // Group rooms by type
        const roomsByType = rooms.reduce((acc, room) => {
            if (!acc[room.roomType]) {
                acc[room.roomType] = [];
            }
            acc[room.roomType].push(room);
            return acc;
        }, {});

        // Calculate availability for each room
        const roomsWithAvailability = await Promise.all(rooms.map(async room => {
            // Calculate total rooms of this type
            const roomsOfType = roomsByType[room.roomType];
            const totalRoomsOfType = roomsOfType.reduce((sum, r) => sum + (r.inventory || 5), 0);
            
            // Default to total rooms if no dates selected
            let availableRooms = totalRoomsOfType;

            // If dates are selected, check availability
            if (checkIn && checkOut) {
                // Convert dates to UTC midnight
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                
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

                console.log('Checking availability for:', {
                    checkIn: utcCheckIn.toISOString(),
                    checkOut: utcCheckOut.toISOString(),
                    roomType: room.roomType
                });

                // Find overlapping confirmed bookings for the same room type
                const overlappingConfirmedBookings = await Booking.find({
                    roomType: room.roomType,
                    $and: [
                        { checkIn: { $lt: utcCheckOut } },
                        { checkOut: { $gt: utcCheckIn } },
                        { status: 'confirmed' } // Only count confirmed bookings
                    ]
                });

                // Get total rooms of this type
                const roomsOfSameType = await Room.find({ roomType: room.roomType });
                const totalRoomsOfType = roomsOfSameType.reduce((acc, curr) => acc + curr.totalRooms, 0);

                // Count confirmed bookings
                const confirmedBookings = overlappingConfirmedBookings.length;

                // Calculate available rooms based only on confirmed bookings
                const availableRooms = totalRoomsOfType - confirmedBookings;

                console.log('Availability calculation:', {
                    roomType: room.roomType,
                    totalRoomsOfType,
                    confirmedBookings,
                    availableRooms,
                    checkIn: utcCheckIn.toISOString(),
                    checkOut: utcCheckOut.toISOString()
                });

                // Add availability info to room object
                const roomWithAvailability = {
                    ...room,
                    isAvailable: availableRooms > 0,
                    availableRooms,
                    totalRoomsOfType,
                    confirmedBookings // Add this for debugging
                };

                return roomWithAvailability;
            }

            return {
                ...room,
                totalRooms: totalRoomsOfType,
                availableRooms,
                isAvailable: availableRooms > 0,
                isFullyBooked: availableRooms === 0
            };
        }));

        res.json(roomsWithAvailability);
    } catch (error) {
        console.error('Error in getRooms:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get featured rooms
export const getFeaturedRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ featured: true });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single room
export const getRoomById = async (req, res) => {
    try {
        console.log('Checking room availability with params:', {
            roomId: req.params.id,
            checkIn: req.query.checkIn
        });

        // Set headers untuk menghindari caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        // Cari kamar berdasarkan ID
        const room = await Room.findById(req.params.id);
        console.log('Found room:', room);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Hitung total kamar untuk tipe ini
        const totalRoomsOfType = room.totalRooms || 0;
        let availableRooms = totalRoomsOfType;

        // Jika ada tanggal check-in yang dipilih, hitung ketersediaan
        if (req.query.checkIn) {
            const checkInDate = new Date(req.query.checkIn);
            checkInDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(checkInDate);
            nextDay.setDate(nextDay.getDate() + 1);

            console.log('Checking bookings between:', {
                checkIn: checkInDate.toISOString(),
                nextDay: nextDay.toISOString()
            });

            // Cari booking yang overlap dengan tanggal yang dipilih
            const activeBookings = await Booking.find({
                roomType: room.roomType,
                status: { $nin: ['cancelled', 'checked_out'] },
                checkIn: { $lt: nextDay },     // Booking dimulai sebelum besok
                checkOut: { $gt: checkInDate }  // dan berakhir setelah hari ini
            });

            // Filter out bookings where the selected date is the checkout date
            const overlappingBookings = activeBookings.filter(booking => {
                const bookingCheckOut = new Date(booking.checkOut);
                bookingCheckOut.setHours(0, 0, 0, 0);
                return bookingCheckOut.getTime() !== checkInDate.getTime();
            });

            console.log('Found active bookings:', activeBookings);

            // Hitung kamar yang tersedia berdasarkan booking yang overlap
            const bookedRooms = overlappingBookings.length;
            availableRooms = totalRoomsOfType - bookedRooms;

            console.log('Availability details:', {
                date: checkInDate.toISOString(),
                totalRooms: totalRoomsOfType,
                overlappingBookings: overlappingBookings.length,
                availableRooms
            });

            console.log('Availability calculation:', {
                roomType: room.roomType,
                totalRoomsOfType,
                bookedRooms,
                availableRooms,
                activeBookings: activeBookings.map(b => ({
                    id: b._id,
                    checkIn: b.checkIn,
                    status: b.status
                }))
            });
        }

        // Pastikan availableRooms tidak negatif
        availableRooms = Math.max(0, availableRooms);

        const response = {
            ...room.toObject(),
            totalRoomsOfType,
            availableRooms
        };

        console.log('Sending response:', response);
        return res.json(response);

    } catch (error) {
        console.error('Error in getRoomById:', error);
        return res.status(500).json({ 
            message: 'Error checking room availability',
            error: error.message 
        });
    }
};

// Create room (admin only)
export const createRoom = async (req, res) => {
    try {
        const { name, description, price, capacity, amenities, roomType, totalRooms = 5 } = req.body;
        const images = [];
        const availableRooms = totalRooms; // Initially all rooms are available

        // Handle image URLs from request body
        for (const [key, url] of Object.entries(req.body)) {
            if (key.startsWith('image') && url) {
                images.push({
                    public_id: `wangobel-rooms/${Date.now()}`,
                    url: url
                });
            }
        }

        const room = new Room({
            name,
            description,
            price,
            capacity,
            amenities,
            roomType,
            images
        });

        const createdRoom = await room.save();

        // Send email notification to subscribers
        try {
            const activeSubscribers = await Subscriber.find({ isActive: true });
            if (activeSubscribers.length > 0) {
                await sendRoomUpdateEmail(activeSubscribers, createdRoom, 'new');
            }
        } catch (emailError) {
            console.error('Failed to send notification emails:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            room: createdRoom
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update room (admin only)
export const updateRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (room) {
            room.name = req.body.name || room.name;
            room.description = req.body.description || room.description;
            room.price = req.body.price || room.price;
            room.capacity = req.body.capacity || room.capacity;
            room.amenities = req.body.amenities || room.amenities;
            room.roomType = req.body.roomType || room.roomType;
            room.isAvailable = req.body.isAvailable ?? room.isAvailable;
            room.featured = req.body.featured ?? room.featured;

            if (req.files && req.files.length > 0) {
                // Delete old images from cloudinary
                for (const image of room.images) {
                    await cloudinary.uploader.destroy(image.public_id);
                }

                // Upload new images
                const images = [];
                for (const file of req.files) {
                    const result = await cloudinary.uploader.upload(file.path);
                    images.push({
                        public_id: result.public_id,
                        url: result.secure_url
                    });
                }
                room.images = images;
            }

            const updatedRoom = await room.save();
            
            // Send email notification to subscribers about the updated room
            try {
                const activeSubscribers = await Subscriber.find({ isActive: true });
                if (activeSubscribers.length > 0) {
                    await sendRoomUpdateEmail(activeSubscribers, updatedRoom, 'update');
                }
            } catch (emailError) {
                console.error('Failed to send notification emails for room update:', emailError);
            }
            
            res.json(updatedRoom);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete room (admin only)
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (room) {
            // Delete images from cloudinary
            for (const image of room.images) {
                await cloudinary.uploader.destroy(image.public_id);
            }
            await room.deleteOne();
            res.json({ message: 'Room removed' });
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create room review
export const createRoomReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const room = await Room.findById(req.params.id);

        if (room) {
            const alreadyReviewed = room.reviews.find(
                (review) => review.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                res.status(400).json({ message: 'Room already reviewed' });
                return;
            }

            const review = {
                user: req.user._id,
                name: req.user.name,
                rating: Number(rating),
                comment,
            };

            room.reviews.push(review);
            room.numReviews = room.reviews.length;
            room.rating =
                room.reviews.reduce((acc, item) => item.rating + acc, 0) /
                room.reviews.length;

            await room.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
