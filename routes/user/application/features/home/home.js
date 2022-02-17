const router = require('express').Router();

router.use('/store', require('./store'));
router.use('/video', require('./video'));
router.use('/demoBooking', require('./demo-booking'));

module.exports = router;