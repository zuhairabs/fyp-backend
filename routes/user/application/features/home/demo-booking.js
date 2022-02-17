const router = require('express').Router();
const handleError = require('../../../../../error_handling/handler');
const demoBooking = require('../../../../../models/operations/demo-booking-schema');
const User = require('../../../../../models/entities/user-schema');

const timeNow = new Date();

// fetch all demo bookings
router.post('/all', (req, res) => {
  try {
    demoBooking.find()
      .select('demoName description demoDate startTime duration image channelName')
      .exec((err, demobookings) => {
        if (err) {
          handleError(err);
          res.status(500).json({ error: 'Internal Server Error' });
        }
        else res.status(200).json({ demobookings });
      });
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// fetch one demo booking
router.post('/single', async (req, res) => {
  try {
    const { bookingData, user } = req.body;
    const HOUR = 60 * 60 * 1000;

    let demoInformation = {
      liveNow: false,
      ended: false,
      userRegistered: false,
      capacityFull: false
    }

    const demo = await demoBooking.findOne({ _id: bookingData._id });
    // console.log(demo);

    if (!demo) return res.status(400).json({ error: 'Demo couldn\'t be found.' });
    else {
      const customers = demo.customers;
      var now = timeNow.getTime();
      const startTime = new Date(demo.startTime).getTime();
      const endTime = startTime + ((demo.duration / 60) * HOUR);

      if (now >= startTime && now < endTime) demoInformation.liveNow = true;
      if (now > endTime) demoInformation.ended = true;
      customers.forEach((customer) => {
        if (customer.user.toString() === user._id) demoInformation.userRegistered = true;
      })
      if(customers.length == demo.capacity)
          demoInformation.capacityFull = true;
      return res.status(200).json({ demoInformation });
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const data = req.body.demoData;

    // var tendayslater = new Date(new Date().getTime() + (5 * 24 * 3600 * 1000));
    // data.demoDate = tendayslater;
    // data.startTime = tendayslater.setHours(12, 30, 00);

    // data.demoDate = timeNow
    // data.startTime = timeNow;

    const demo = await demoBooking.create(data);
    if (!demo) {
      return res.status(400).json({
        error: 'Unable to save demo booking.',
      });
    }

    res.status(200).json({ data: demo });
  }
  catch (error) {
    console.log(error)
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
})

module.exports = router;

// dummyUplaoad - {"demoName": "Victorinox Razer", "description": "Demo of Victorinox shaving Razer for men and women", "duration": "20", "tags": ["Victorinox", "Accessory", "Beauty"]}
// fetch single - {"_id": "608f9a71a62ad737e86f92b5", "demoName": "x360 Pavillion"}

