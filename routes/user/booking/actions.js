const router = require('express').Router();
router.use('/create', require('./controllers/create'));
router.use('/approve', require('./controllers/approve'));
router.use('/cancel', require('./controllers/cancel'));
router.use('/edit', require('./controllers/edit'));

module.exports = router;
