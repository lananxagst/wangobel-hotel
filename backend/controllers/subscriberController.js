import expressAsyncHandler from 'express-async-handler';
import Subscriber from '../models/subscriberModel.js';

// For debugging purposes
const debug = (message, data = null) => {
  console.log(`[SUBSCRIBER] ${message}`, data || '');
};

// @desc    Subscribe to newsletter
// @route   POST /api/subscribers
// @access  Public
const subscribeNewsletter = expressAsyncHandler(async (req, res) => {
  debug('Subscribe request received', req.body);
  const { email } = req.body;

  if (!email) {
    debug('Email not provided');
    res.status(400);
    throw new Error('Please provide an email address');
  }

  try {
    // Check if subscriber already exists
    debug('Checking if subscriber exists');
    const existingSubscriber = await Subscriber.findOne({ email });
    
    if (existingSubscriber) {
      debug('Subscriber found', existingSubscriber);
      if (existingSubscriber.isActive) {
        debug('Subscriber already active');
        return res.status(400).json({
          success: false,
          message: 'Email already subscribed'
        });
      } else {
        // Reactivate subscription
        debug('Reactivating subscription');
        existingSubscriber.isActive = true;
        await existingSubscriber.save();
        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.'
        });
      }
    } else {
      // Create new subscriber
      debug('Creating new subscriber');
      const subscriber = await Subscriber.create({ email });
      debug('Subscriber created', subscriber);
      return res.status(201).json({
        success: true,
        message: 'Thank you for subscribing to our newsletter!'
      });
    }
  } catch (error) {
    debug('Error in subscription process', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while processing subscription',
      error: error.message
    });
  }
});

// @desc    Get all subscribers
// @route   GET /api/subscribers
// @access  Private/Admin
const getSubscribers = expressAsyncHandler(async (req, res) => {
  debug('Getting all subscribers');
  try {
    const subscribers = await Subscriber.find({});
    debug(`Found ${subscribers.length} subscribers`);
    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers
    });
  } catch (error) {
    debug('Error fetching subscribers', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscribers',
      error: error.message
    });
  }
});

// @desc    Unsubscribe from newsletter
// @route   DELETE /api/subscribers/:email
// @access  Public
const unsubscribeNewsletter = expressAsyncHandler(async (req, res) => {
  const email = req.params.email;
  debug('Unsubscribe request for', email);
  
  try {
    const subscriber = await Subscriber.findOne({ email });

    if (!subscriber) {
      debug('Subscriber not found');
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    debug('Deactivating subscriber');
    subscriber.isActive = false;
    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    debug('Error in unsubscription process', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while processing unsubscription',
      error: error.message
    });
  }
});

export {
  subscribeNewsletter,
  getSubscribers,
  unsubscribeNewsletter
};
