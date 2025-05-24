import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} from '../controllers/wishlistController.js';

const router = express.Router();

router.route('/')
    .get(protect, getWishlist);

router.route('/:roomId')
    .post(protect, addToWishlist)
    .delete(protect, removeFromWishlist);

export default router;
