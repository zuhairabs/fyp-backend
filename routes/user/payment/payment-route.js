const router = require('express').Router();

const createPayment = require('./create-payment');
const razorpay = require('./razorpay');

router.use('/createPayment', createPayment);
router.use('/razorpay', razorpay);

module.exports = router;
