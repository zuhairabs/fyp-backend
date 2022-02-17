const router = require('express').Router();
const archiveDemoBooking = require('../../../../models/operations/archive-demo-booking-schema');
const User = require('../../../../models/entities/user-schema');
const demoBooking = require('../../../../models/operations/demo-booking-schema');
const saveNewNotification = require('../../../../utils/notification-constructor');
const { dispatchSingleNotification, dispatchSingleNotificationApple } = require('../../../../utils/notification-dispatcher');
const handleError = require('../../../../error_handling/handler');
const verifySession = require('../../auth/verifySession');

// Steps followed: 
// 1. get user credentials and demo booking data
// 2. check if slots for the demo are available. If not, display not available message.
// 3. if slot availabale, push booking data into user bookings and user id into demo booking customers
// 4. generate notification for the user

router.post('/customers', verifySession, async (req, res) => {
  const HOUR = 60 * 60 * 1000;
  var options = { weekday: 'short', month: 'short', day: 'numeric' };
  date = new Date().toLocaleString("en-US", options);

  const { bookingData, user } = req.body;

  let demoInformation = {
    liveNow: false,
    ended: false,
    userRegistered: false
  }

  const demo = await demoBooking.findOne({ _id: bookingData._id })
  const customers = demo.customers;

  customers.forEach((customer) => {
    if (customer.user.toString() === user._id) {
      demoInformation.userRegistered = true;
    };
  })

  let now = new Date().getTime();
  now = new Date(now);
  const startTime = demo.startTime;
  const endTime = new Date(now + (demo.duration / 60) * HOUR);

  if (startTime >= now && now < endTime) demoInformation.liveNow = true;
  if (now > endTime) demoInformation.ended = true;

  res.status(200).json({ demoInformation });
})

router.post('/', verifySession, async (req, res) => {
  try {
    const { cred, bookingData } = req.body;

    const demo = await demoBooking.findOne({ _id: bookingData._id });
    const user = await User.findOne({ phone: cred.phone });

    if (!demo) return res.status(400).json({ error: 'Unable to get demo.' });
    else {
      // check if user already registered
      let registered = false;
      demo.customers.forEach((customer) => {
        if (customer.user.toString() === user._id.toString()) registered = true;
      })

      // check if slots are full or not
      const available = demo.customers.length < demo.capacity;

      if (available && !registered) {
        const userbooking = await User.findOneAndUpdate({ phone: cred.phone }, {
          $push: {
            demoBookings: demo,
          },
        });

        customer = {
          user: user._id,
          interested: true,
          status: false,
        }
        const demobooking = await demoBooking.findOneAndUpdate({ _id: bookingData._id }, {
          $push: {
            customers: customer
          },
        }).populate([{
          path: 'business',
          select: 'display_name logo'
        },
        {
          path: 'store',
          select: 'firebaseToken deviceToken'
        }])

        if (!userbooking || !demobooking) {
          return res.status(500).json({ error: 'Internal server error.' });
        }

        const dateOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };

        const displayDate = new Date(demobooking.startTime).toLocaleDateString(
          'en-US',
          dateOptions
        );

        const titleUser = "Live Demo!";
        const titleStore = 'New Live Demo Booking!';

        const bodyUser = `Dear ${user.firstName}, you have registered for ${demo.demoName} on ${displayDate}.`
        const bodyStore = `A user registered for an upcoming live event - ${demo.demoName} by your business on ${displayDate}.`

        // Notification for Users
        dispatchSingleNotification(user.firebaseToken, titleUser, bodyUser, {
          booking: demo._id.toString(),
          archived: "false"
        });
        saveNewNotification(
          titleUser,
          bodyUser,
          demobooking.business.logo,
          user._id,
          null,
          demo._id
        );

        //Notification for Store
        dispatchSingleNotification(demobooking.store.firebaseToken, titleStore, bodyStore, {
          booking: demo._id.toString(),
          archived: "false"
        });
        saveNewNotification(
          titleStore,
          bodyStore,
          demobooking.business.logo,
          null,
          demobooking.store._id,
          demo._id
        );

        dispatchSingleNotificationApple(
          demobooking.store.deviceToken,
          titleStore,
          bodyStore,
          { booking: demo._id.toString() }
        );

        return res.status(201).json({ booking: "Booking done!" });
      }
      if (!available) return res.status(202).json({ slotsFull: `All slots for ${demo.demoName} are booked.` });
      else if (registered) return res.status(202).json({ registered: `User already registered for ${demo.demoName}.` });
    }
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
})

module.exports = router;