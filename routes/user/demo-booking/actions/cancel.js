const router = require('express').Router();
const archiveDemoBooking = require('../../../../models/operations/archive-demo-booking-schema');
const User = require('../../../../models/entities/user-schema');
const demoBooking = require('../../../../models/operations/demo-booking-schema');
const saveNewNotification = require('../../../../utils/notification-constructor');
const { dispatchSingleNotification } = require('../../../../utils/notification-dispatcher');
const handleError = require('../../../../error_handling/handler');

// Steps followed:
// 1. get user cred and demo booking data
// 2. pull demo booking from user and customer from demo booking
// 3. push demo booking to user archived booking.
// 4. generate notification for cancelling to the user.

router.post('/', async (req, res) => {
  try {
    const { cred, bookingData } = req.body;

    const user = await User.findOne({ phone: cred.phone });
    const demo = await demoBooking.findOne({ _id: bookingData._id });

    if (!demo) return res.status(400).json({ error: 'Demo not found.' });
    else {
      const archiveCustomer = {
        user: user._id,
        interested: false,
        status: 'Cancelled'
      }

      let archivedemobooking = await archiveDemoBooking.findOneAndUpdate({ demoId: demo._id }, {
        $push: {
          customers: archiveCustomer
        }
      })
      if (!archivedemobooking) {
        const archiveDemoData = {
          demoId: demo._id,
          demoName: demo.demoName,
          demoDate: demo.demoDate,
          description: demo.description,
          startTime: demo.startTime,
          capacity: demo.capacity,
          tags: demo.tags,
          customers: [archiveCustomer]
        }
        archivedemobooking = await archiveDemoBooking.create(archiveDemoData);
      }

      const removedUser = await demoBooking.findOneAndUpdate({ _id: demo._id }, {
        $pull: {
          customers: { user: user._id }
        }
      }, { multi: true });
      const demoRemove = await User.findOneAndUpdate({ phone: user.phone }, {
        $pull: {
          demoBookings: demo._id
        },
        $push: {
          archiveDemoBookings: archivedemobooking._id
        }
      })

      if (!removedUser || !demoRemove) res.status(500).json({ error: 'Could not cancel registration.' });
      else res.status(200).json({ cancel: 'Cancelled your registration for this demo.' });
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
})

module.exports = router;
