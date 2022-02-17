const router = require('express').Router();
const User = require('../../../models/entities/user-schema');
const Booking = require('../../../models/operations/booking-schema');
const demoBooking = require('../../../models/operations/demo-booking-schema');
const Store = require('../../../models/entities/store-schema');
const vFeedback = require('../../../models/operations/virtual-feedback');
const sFeedback = require('../../../models/operations/instore-feedback');
const handleError = require('../../../error_handling/handler');

router.post('/callFeedback', async (req, res) => {
  try {
    const { cred, bookingData, feedback } = req.body;

    const user = await User.findOne({ phone: cred.phone });
    const booking = await Booking.findOne({ _id: bookingData._id });
    const demobooking = await demoBooking.findOne({ _id: bookingData._id });

    if (!user) return res.status(400).json({ error: 'User not found!' });
    if (!booking && !demobooking) return res.status(400).json({ error: 'Booking not found.' });
    else {
      let type = null;
      (!booking) ? type = 'demobooking' : type = 'booking';
      const bookingfeedback = {
        bookingType: type,
        user: user._id,
        date: new Date(),
        userFeedback: feedback
      };
      type === 'booking' ? bookingfeedback.booking = bookingData._id : bookingfeedback.demobooking = bookingData._id;

      const createFeedback = await vFeedback.create(bookingfeedback);
      if (!createFeedback) return res.status(400).json({ error: 'Feedback couldn\'t be created' });
      else return res.status(200).json({ feedback: 'Feedback succesfully given for this booking.' });
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
})

router.post('/storeFeedback', async (req, res) => {
  try {
    const { cred, storeData, feedback } = req.body;

    const user = await User.findOne({ phone: cred.phone });
    const store = await Store.findOne({ _id: storeData._id });

    if (!user) return res.status(400).json({ error: 'User not found!' });
    if (!store) return res.status(400).json({ error: 'Store not found.' });
    else {
      const storefeedback = {
        store: storeData._id,
        bookingType: 'in-store',
        user: user._id,
        date: new Date(),
        userFeedback: feedback
      };

      const createFeedback = await sFeedback.create(storefeedback);
      if (!createFeedback) return res.status(400).json({ error: 'Feedback couldn\'t be created' });
      else return res.status(201).json({ feedback: 'Feedback succesfully given for the store.' });
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
})

module.exports = router;