import expressAsyncHandler from 'express-async-handler';
import Subscriber from '../models/subscriberModel.js';

// @desc    Subscribe to newsletter
// @route   POST /api/subscribers
// @access  Public
const subscribeNewsletter = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  // Check if subscriber already exists
  const existingSubscriber = await Subscriber.findOne({ email });
  if (existingSubscriber) {
    if (existingSubscriber.isActive) {
      res.status(400);
      throw new Error('Email already subscribed');
    } else {
      // Reactivate subscription
      existingSubscriber.isActive = true;
      await existingSubscriber.save();
      res.status(200).json({
        message: 'Welcome back! Your subscription has been reactivated.'
      });
    }
  } else {
    // Create new subscriber
    const subscriber = await Subscriber.create({ email });
    res.status(201).json({
      message: 'Thank you for subscribing to our newsletter!'
    });
  }
});

// @desc    Get all active subscribers
// @route   GET /api/subscribers
// @access  Private/Admin
const getSubscribers = expressAsyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find({ isActive: true });
  res.status(200).json(subscribers);
});

// @desc    Unsubscribe from newsletter
// @route   DELETE /api/subscribers/:email
// @access  Public
const unsubscribeNewsletter = expressAsyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findOne({ email: req.params.email });

  if (!subscriber) {
    res.status(404);
    throw new Error('Subscriber not found');
  }

  subscriber.isActive = false;
  await subscriber.save();

  res.status(200).json({
    message: 'Successfully unsubscribed from newsletter'
  });
});

export {
  subscribeNewsletter,
  getSubscribers,
  unsubscribeNewsletter
};
