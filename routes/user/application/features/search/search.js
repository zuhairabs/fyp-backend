const router = require('express').Router();
const full = require('./full');
const partial = require('./partial');

router.use('/full', full);
router.use('/partial', partial);

module.exports = router;
