const router = require('express').Router();
const archiveDemoBooking = require('../../../models/operations/archive-demo-booking-schema');
const User = require('../../../models/entities/user-schema');
const demoBooking = require('../../../models/operations/demo-booking-schema');
const handleError = require('../../../error_handling/handler');

//FORMAT OF DATA SENT THROUGH POSTMAN
// {
//   "cred": {
//     "phone": 9035297350
//   },
//   "bookingData": {
//     "_id": "608fa28f8351e32c08f1985d"  --> id of demo booking.
//   }
// }

const HOUR = 60 * 60 * 1000;
const timeNow = new Date();

// fetch all user demo bookings
router.post('/all', async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred) return res.status(400).json({ error: 'Invalid request format.' });
    else {
      const user = await User.findOne({ phone: cred.phone })
        .populate({
          path: 'demoBookings',
          select: 'demoName description demoDate startTime duration image'
        })
        .sort('startTime');

      if (!user) return res.status(400).json({ error: 'User not found.' });
      else return res.status(200).json({ demobookings: user.demoBookings });
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

async function archivalProcess(user, bookingData) {
  const archiveCustomer = {
    user: user._id,
    interested: true,
    status: 'Missed'
  }
  let archivedemobooking = await archiveDemoBooking.findOneAndUpdate({ demoId: bookingData._id }, {
    $push: {
      customers: archiveCustomer
    }
  })
  if (!archivedemobooking) {
    const archiveDemoData = {
      demoId: bookingData._id,
      demoName: bookingData.demoName,
      demoDate: bookingData.demoDate,
      description: bookingData.description,
      startTime: bookingData.startTime,
      capacity: bookingData.capacity,
      tags: bookingData.tags,
      customers: [archiveCustomer]
    }
    archivedemobooking = await archiveDemoBooking.create(archiveDemoData);
  }
  await demoBooking.findOneAndUpdate({ _id: bookingData._id }, {
    $pull: {
      customers: { user: user._id }
    }
  }, { multi: true });

  await User.findOneAndUpdate({ phone: user.phone }, {
    $pull: {
      demoBookings: bookingData._id
    },
    $push: {
      archiveDemoBookings: archivedemobooking._id
    }
  })
}

// fetch one user demo bookings
router.post('/single', async (req, res) => {
  try {
    const { cred } = req.body;
    const { bookingData } = req.body;

    if (!cred || !bookingData) return res.status(400).json({ error: 'Invalid request format.' });
    else {
      const user = await User.findOne({ phone: cred.phone })
      if (!user) return res.status(404).json({ error: 'User not found.' });
      else {
        if (user.demoBookings.includes(bookingData._id)) {
          demoBooking.findOne({ _id: bookingData._id })
            .select('demoName description customers demoDate startTime duration image channelName')
            .exec(async (err, demobooking) => {
              let status = "Upcoming";
              let flag = false;
              var now = timeNow.getTime();
              const startTime = new Date(demobooking.startTime).getTime();
              const endTime = startTime + ((demobooking.duration / 60) * HOUR);

              if (now >= startTime && now < endTime) status = "Live";
              if (now > endTime) flag = true;
              if (flag) {
                demobooking.customers.every(element => {
                  if (element.user.equals(user._id)) {
                    if (element.interested == false) {
                      status = "Cancelled";
                      return false;
                    }
                    status = (element.status) ? "Completed" : "Missed";
                    if (status === 'Missed') archivalProcess(user, bookingData);
                    return false;
                  }
                  return true;
                });
              }
              return res.status(200).json({ demobooking, status })
            });
        }
        else return res.status(202).json({ error: 'User not registered for this demo.' });
      }
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// fetch all archived demo bookings of a user
router.post('/archived/all', async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }

    const user = await User.findOne({ phone: cred.phone })
      .populate({
        path: 'archiveDemoBookings',
        select: 'demoName description demoDate startTime duration image',
      });

    if (!user) return res.status(400).json({ error: 'User not found.' });
    else return res.status(200).json({ archivedemobookings: user.archiveDemoBookings });
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// fetch one user archived demo booking
router.post('/single/archived', async (req, res) => {
  try {
    const { cred } = req.body;
    const { bookingData } = req.body;

    if (!cred || !bookingData) return res.status(400).json({ error: 'Invalid request format.' });
    else {
      const user = await User.findOne({ phone: cred.phone })
      if (!user) return res.status(404).json({ error: 'User not found.' });
      else {
        if (user.archiveDemoBookings.includes(bookingData._id)) {
          archiveDemoBooking.findOne({ _id: bookingData._id })
            .select('demoName description customers demoDate startTime duration image')
            .exec((err, archivedemobooking) => {
              let status = "Upcoming";
              let flag = false;
              var now = timeNow.getTime();
              const startTime = new Date(archivedemobooking.startTime).getTime();
              const endTime = startTime + ((archivedemobooking.duration / 60) * HOUR);

              if (now >= startTime && now < endTime) status = "Live";
              if (now > endTime) flag = true;
              if (flag) {
                archivedemobooking.customers.every(element => {
                  if (element.user == user._id) {
                    if (element.interested == false) {
                      status = "Cancelled"; return false;
                    }
                    else status = (element.status) ? "Completed" : "Missed";
                    return false;
                  }
                  return true;
                });
              }
              return res.status(200).json({ archivedemobooking, status })
            });
        }
        else return res.status(202).json({ error: 'User never registered for this demo.' });
      }
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
