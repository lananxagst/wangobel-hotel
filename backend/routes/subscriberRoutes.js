import express from 'express';
import {
  subscribeNewsletter,
  getSubscribers,
  unsubscribeNewsletter
} from '../controllers/subscriberController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(subscribeNewsletter)
  .get(protect, admin, getSubscribers);

router.route('/:email')
  .delete(unsubscribeNewsletter);

export default router;
