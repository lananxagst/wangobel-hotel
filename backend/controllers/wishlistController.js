import Wishlist from '../models/wishlistModel.js';
import Room from '../models/roomModel.js';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('rooms');
        
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user._id,
                rooms: []
            });
        }

        res.json(wishlist.rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add room to wishlist
// @route   POST /api/wishlist/:roomId
// @access  Private
export const addToWishlist = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user._id,
                rooms: [roomId]
            });
        } else if (!wishlist.rooms.includes(roomId)) {
            wishlist.rooms.push(roomId);
            await wishlist.save();
        }

        res.json({ message: 'Room added to wishlist' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove room from wishlist
// @route   DELETE /api/wishlist/:roomId
// @access  Private
export const removeFromWishlist = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        wishlist.rooms = wishlist.rooms.filter(room => room.toString() !== roomId);
        await wishlist.save();

        res.json({ message: 'Room removed from wishlist' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
