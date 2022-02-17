const router = require('express').Router();
const handleError = require('../../../error_handling/handler');
const Payment = require('../../../models/operations/payment-schema');

router.post('/', async (req, res) => {
  try {
    const { paymentDetail } = req.body;
    const payment = await Payment.create(paymentDetail);
    if (!payment) {
      return res.status(400).json({
        error: 'Unable to save payment data.',
      });
    } else return res.status(200).json({ payment: 'Payment details saved' });
  } catch (error) {
    console.log(error);
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
