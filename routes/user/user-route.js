const router = require('express').Router();

const applicationRoute = require('./application/user-application');
const authenticationRoute = require('./auth/user-auth');
const bookingRoute = require('./booking/user-booking');
const profileRoute = require('./profile/user-profile');
const orderRoute = require('./order/user-order');
const demoBooking = require('./demo-booking/user-demo-booking')
const payment = require('./payment/payment-route');
const feedback = require('./feedback/feedback-routes');

router.use('/app', applicationRoute);
router.use('/auth', authenticationRoute);
router.use('/booking', bookingRoute);
router.use('/profile', profileRoute);
router.use('/order', orderRoute);
router.use('/demoBooking', demoBooking);
router.use('/payment', payment);
router.use('/feedback', feedback);

module.exports = router;
