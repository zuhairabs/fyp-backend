const express = require('express');
const router = express.Router();

// Store authentication routes
const authenticationRouter = require('./auth/store-auth');

router.use('/auth', authenticationRouter);

// Store booking routes
const bookingRouter = require('./booking/store-booking');

router.use('/book', bookingRouter);

// Store detail routes
const storeDataRouter = require('./stores/store-data');

router.use('/store', storeDataRouter);

module.exports = router;
