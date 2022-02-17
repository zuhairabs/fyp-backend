const router = require('express').Router();
router.use('/fetch', require('./actions/fetch'));
router.use('/register', require('./actions/register'));

module.exports = router;
