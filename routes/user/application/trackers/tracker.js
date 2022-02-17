const router = require('express').Router();
router.use('/history', require('./history/history'));

module.exports = router;
