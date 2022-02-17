const router = require('express').Router();
const SupportRequest = require('../../../../../models/operations/support-request-schema');
const handleError = require('../../../../../error_handling/handler');

router.post('/submit', (req, res) => {
  const supportRequest = new SupportRequest(req.body.supportRequest);
  supportRequest.save((err, _savedRequest) => {
    if (err) {
      handleError(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else res.status(200).json({ response: 'Request submitted successfully' });
  });
});

module.exports = router;
