const router = require('express').Router();

const register = require('./actions/register');
const cancel = require('./actions/cancel');
const join = require('./actions/joindemocall');
const unreg = require('./actions/unregister');

router.use('/register', register);
router.use('/cancel', cancel);
router.use('/joindemocall', join);
router.use('/unregister', unreg);

module.exports = router;