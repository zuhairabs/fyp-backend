const router = require('express').Router();
router.use('/favourite', require('./features/favourite/favourite'));
router.use('/home', require('./features/home/home'));
router.use('/review', require('./features/review/review'));
router.use('/store', require('./features/stores/stores'));
router.use('/search', require('./features/search/search'));
router.use('/support', require('./features/support/support'));
router.use('/tracker', require('./trackers/tracker'));

module.exports = router;
