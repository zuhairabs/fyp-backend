const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const handleError = require('../../../error_handling/handler');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

router.post('/createOrder', async (req, res) => {
  try {
    const { paymentDetails } = req.body;

    const order = await razorpay.orders.create({
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
    });
    return res.status(200).json({ order: order });
  }
  catch (err) {
    handleError(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
})

router.post("/verifyPayment", async (req, res) => {
  try {
    const { orderID, transaction } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(`${orderID}|${transaction.razorpay_payment_id}`)
      .digest("hex");

    res.send({ validSignature: generatedSignature === transaction.razorpay_signature });
  }
  catch (err) {
    handleError(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;