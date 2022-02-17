const router = require('express').Router();
router.use('/geocoding', require('./geocoding'));

module.exports = router;
