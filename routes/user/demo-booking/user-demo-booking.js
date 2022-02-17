const router = require('express').Router();

const actions = require('./actions');
const fetch = require('./fetch');

router.use('/fetch', fetch);
router.use('/actions', actions);

module.exports = router;