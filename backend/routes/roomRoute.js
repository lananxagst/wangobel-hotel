import express from 'express';
import {
    getRooms,
    getFeaturedRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    createRoomReview
} from '../controllers/roomController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getRooms)
    .post(protect, admin, createRoom);

router.get('/featured', getFeaturedRooms);

router.route('/:id')
    .get(getRoomById)
    .put(protect, admin, updateRoom)
    .delete(protect, admin, deleteRoom);

router.route('/:id/reviews').post(protect, createRoomReview);

export default router;
