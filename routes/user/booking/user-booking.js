const router = require('express').Router();
router.use('/actions', require('./actions'));
router.use('/fetch', require('./fetch'));

module.exports = router;
