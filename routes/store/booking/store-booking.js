const router = require('express').Router();
const Booking = require('../../../models/operations/booking-schema');
const Store = require('../../../models/entities/store-schema');
const User = require('../../../models/entities/user-schema');
const ArchiveBooking = require('../../../models/operations/archive-booking-schema');
const Notification = require('../../../models/operations/notification-schema');
const demoBooking = require('../../../models/operations/demo-booking-schema');
const archiveDemoBooking = require('../../../models/operations/archive-demo-booking-schema');

const { dispatchSingleNotification, dispatchSingleNotificationApple } = require('../../../utils/notification-dispatcher');

const verifySession = require('../auth/verifySession');
const handleError = require('../../../error_handling/handler');
const createArchiveBooking = require('../../../controllers/archive-booking');
const saveNewNotification = require('../../../utils/notification-constructor');

// 01. To approve bookings from store side
router.post('/approve', verifySession, async (req, res) => {
  try {
    const { bookingData } = req.body;

    if (!bookingData) {
      return res.status(400).json({ error: 'Invalid request format.' });
    }

    const booking = await Booking.findById(bookingData._id);

    if (!booking) {
      return res.status(400).json({ error: 'Booking not found.' });
    }

    if (bookingData.approve) {
      await Booking.findByIdAndUpdate(bookingData._id, {
        approved: true,
      });

      return res.status(200).json({ response: 'Booking approved by store' });
    }

    return res.status(400).json({ error: 'No instructions for approval.' });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

const getSum = (arr) => {
  let sum = arr.reduce((tot, num) => {
    return tot + num;
  }, 0);
  return sum;
}

// 02. To complete booking
router.post('/complete', verifySession, async (req, res) => {
  try {
    if (req.body.bookingData) {
      const { bookingData } = req.body;

      if (!bookingData) {
        return res.status(400).json({ error: 'Invalid request format.' });
      }

      const booking = await Booking.findByIdAndUpdate(
        bookingData._id,
        {
          status: "completed",
        }
      );

      if (!booking) {
        return res.status(401).json({ error: 'Booking not found' });
      }

      return res.status(200).json({ response: 'Booking completed by store' });
    }
    else {
      const threshold = 300000;

      const { channelName, callDuration } = req.body;

      if (!channelName) {
        return res.status(400).json({ error: 'Invalid request format.' });
      }

      let booking = await Booking.findOne({ bookingId: channelName });

      let sum = await getSum(booking.durations);

      if (sum + callDuration >= threshold) {
        booking = await Booking.findByIdAndUpdate(
          booking._id,
          {
            status: "completed",
            $push: { durations: callDuration }
          }
        );
      }
      else {
        booking = await Booking.findByIdAndUpdate(
          booking._id,
          {
            $push: { durations: callDuration }
          }
        );
      }

      if (!booking) {
        return res.status(401).json({ error: 'Booking not found' });
      }

      return res.status(200).json({ response: 'Booking completed by store' });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

const timeNow = new Date().getTime();

// 03. Fetch bookings for store
router.post('/bookings', async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred || !req.body.date) {
      return res.status(400).json({ error: 'Invalid request format.' });
    }

    const { day, month, year } = req.body.date;
    let allBookings = [];

    const store = await Store.findOne({ phone: cred.phone })
      .populate({
        path: 'bookings',
        populate: {
          path: 'user',
          select: 'phone firstName lastName avatar',
        },
      })
      .select('bookings _id');
    store.bookings.forEach(booking => {
      booking.booktype = 'booking';
      allBookings.push(booking);
    });

    const demoBookings = await demoBooking.find({ store: store._id });
    console.log(demoBookings);
    demoBookings.forEach(demobooking => {
      demobooking.booktype = 'demobooking';
      demobooking._doc = {
        ...demobooking._doc,
        type: 'live',
        status: 'upcoming',
        start: demobooking.startTime
      }
      allBookings.push(demobooking);
    });

    if (!store) {
      return res.status(400).json({ error: 'Store not found.' });
    }

    const todayBooking = allBookings.filter(
      (booking) => {
        return (
          (booking.booktype === 'booking' &&
            booking.start.getDate() === day &&
            booking.start.getMonth() + 1 === month &&
            booking.start.getFullYear() === year)
          ||
          (booking.booktype === 'demobooking' &&

            booking.startTime.getDate() === day &&
            booking.startTime.getMonth() + 1 === month &&
            booking.startTime.getFullYear() === year)
        )
      }).sort((b1, b2) => {
        let book1 = b1.booktype === 'booking' ? b1.start : b1.startTime;
        let book2 = b2.booktype === 'booking' ? b2.start : b2.startTime;
        return book1.getTime() - book2.getTime();
      });

    const resData = {
      _id: store._id,
      bookings: todayBooking,
      user: store.user,
    };
    // console.log(resData);
    return res.status(200).json(resData);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

// 04. Fetch upcoming bookings for store
router.post('/bookings/range', async (req, res) => {
  try {
    const { cred } = req.body;
    if (!cred) {
      return res.status(400).json({ error: 'Invalid request format.' });
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(req.body.end);
    endDate.setHours(23, 59, 59, 999);

    const store = await Store.findOne({ phone: cred.phone });

    const bookings = await Booking.find({
      store: store._id,
      start: { $gte: startDate },
      end: { $lte: endDate },
    })
      .sort('start')
      .populate({
        path: 'user',
        select: 'phone firstName lastName avatar',
      });

    const archivedBookings = await ArchiveBooking.find({
      store: store._id,
      start: { $gte: req.body.end },
      end: { $lte: req.body.end },
    })
      .sort('start')
      .populate({
        path: 'user',
        select: 'phone firstName lastName avatar',
      });

    const demobookings = await demoBooking.find({
      store: store._id,
      startTime: { $gte: startDate, $lte: endDate },
    })
      .select('demoName startTime image description duration demoDate capacity tags customers')
      .sort('startTime')

    demobookings.forEach(async (demobooking) => {
      demobooking._doc = {
        ...demobooking._doc,
        type: 'live',
        status: 'upcoming',
        start: demobooking.startTime
      }
      if (demobooking.startTime.getTime() < (new Date(req.body.end).getTime() + (75 * 60 * 1000))) {
        let archivedemobooking = await archiveDemoBooking.findOne({ demoId: demobooking._id })
        if (!archivedemobooking) {
          const archiveDemoData = {
            demoId: demobooking._id,
            demoName: demobooking.demoName,
            demoDate: demobooking.demoDate,
            description: demobooking.description,
            startTime: demobooking.startTime,
            capacity: demobooking.capacity,
            tags: demobooking.tags,
            customers: demobooking.customers,
            store: store._id
          }
          archivedemobooking = await archiveDemoBooking.create(archiveDemoData);
          await demoBooking.findOneAndDelete({ _id: demobooking._id }, { multi: true });
          await Store.findOneAndUpdate({ phone: store.phone }, {
            $push: {
              archiveDemoBookings: archivedemobooking._id
            },
            $pull: {
              demoBookings: demobooking._id
            },
          })
        }
      }
      else {
        demobooking._doc = {
          ...demobooking._doc,
          type: 'live',
          status: 'upcoming',
          start: demobooking.startTime
        }
      }
    });

    const archivedemobookings = await archiveDemoBooking.find({
      store: store._id,
      startTime: { $gte: startDate, $lte: endDate },
    })
      .select('demoName startTime image description duration')
      .sort('startTime')
    archivedemobookings.forEach(archivedemobooking => {
      console.log('coming from archived demo...')
      archivedemobooking._doc = {
        ...archivedemobooking._doc,
        type: 'live',
        status: 'completed',
        start: archivedemobooking.startTime
      }
    });

    const resData = {
      _id: store._id,
      bookings: [...bookings, ...archivedBookings, ...demobookings, ...archivedemobookings],
    };

    return res.status(200).json(resData);
  } catch (err) {
    handleError(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 05. Scan qrcode to complete booking and generate notification
router.post('/scanqr', async (req, res) => {
  try {
    const bookingId = req.body.booking_id;
    const foundBooking = await Booking.findOne({ bookingId });
    if (!foundBooking) res.status(404).json({ error: 'Booking not found' });
    else {
      const { userId, storeId } = foundBooking;
      const user = await User.findOne(userId).select('firebaseToken _id');
      const store = await Store.findOne(storeId)
        .select('business _id')
        .populate({ path: 'business', select: 'logo' });
      const title = 'Booking completed';
      const body = 'Your booking was successfully completed';
      createArchiveBooking(foundBooking, 'completed').then((archivedId) => {
        res.status(200).json({ response: 'Booking completed' });
        dispatchSingleNotification(user.firebaseToken, title, body, {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-60'
        });
        dispatchSingleNotificationApple(user.deviceToken, title, body, {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-60'
        });
        saveNewNotification(
          title,
          body,
          store.business.logo,
          user._id,
          null,
          archivedId,
          true
        );
      });
    }
  } catch (error) {
    handleError(error);
    res.status(500).json({ error });
  }
});

// fetch one user booking
router.post('/bookings/single', async (req, res) => {
  try {
    const { cred } = req.body;
    const { bookingData } = req.body;

    if (!cred || !bookingData) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }

    const booking = await Booking.findOne({
      _id: bookingData._id,
    })
      .populate('store', 'phone')
      .populate({
        path: 'user',
        select: 'phone firstName lastName avatar',
      });

    const demobooking = await demoBooking.findOne({ _id: bookingData._id }).select('demoName description startTime duration channelName image _id');
    demobooking._doc = {
      ...demobooking._doc,
      type: 'live',
      status: 'upcoming',
      start: demobooking.startTime
    }

    if (!booking && !demobooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    else if (booking && booking.store.phone !== cred.phone) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    else return res.status(200).json({ booking: booking ? booking : demobooking });
  }
  catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// fetch one user archived booking
router.post('/bookings/single/archived', async (req, res) => {
  try {
    const { cred } = req.body;
    const { bookingData } = req.body;

    if (!cred || !bookingData) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }

    const booking = await ArchiveBooking.findOne({
      _id: bookingData._id,
    })
      .populate('store', 'phone')
      .populate({
        path: 'user',
        select: 'phone firstName lastName avatar',
      });

    const archivedemobooking = await archiveDemoBooking.findOne({ _id: bookingData._id })
    archivedemobooking._doc = {
      ...archivedemobooking._doc,
      type: 'live',
      status: 'completed',
      start: demobooking.startTime
    }

    if (!booking && !demobooking) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    // if (booking.user.phone !== cred.phone) {
    //   return res.status(401).json({
    //     error: 'Unauthorized access',
    //   });
    // }

    if (booking)
      return res.status(200).json({
        booking: booking ? booking : demobooking,

      });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// //fetch all store upcoming demo bookings (only for the specified date)
// router.post('/demoBookings/all', async (req, res) => {
//   try {
//     const { cred } = req.body;

//     if (!cred || !req.body.date) {
//       return res.status(400).json({ error: 'Invalid request format.' });
//     }
//     const { day, month, year } = req.body.date;
//     let allBookings = [];

//     const store = await Store.findOne({ phone: cred.phone });
//     if (!store) return res.status(400).json({ error: 'Could not find store.' });
//     else {
//       const demoBookings = await demoBooking.find({ store: store._id })
//       allBookings = demoBookings
//         .filter(demobooking => {
//           return (
//             demobooking.startTime.getDate() === day &&
//             demobooking.startTime.getMonth() + 1 === month &&
//             demobooking.startTime.getFullYear() === year
//           )
//         })
//         .sort((b1, b2) => {
//           return b1.startTime.getTime() - b2.startTime.getTime();
//         });
//       allBookings.forEach(demobooking => {
//         demobooking._doc = {
//           ...demobooking._doc,
//           type: 'live',
//           status: 'upcoming',
//           start: demobooking.startTime
//         }
//       })

//       if (!demoBookings) return res.status(500).json({ error: 'Internal server error.' });
//       else return res.status(200).json({ demobookings: allBookings });
//     }
//   }
//   catch (error) {
//     handleError(error);
//     return res.status(500).json({ error: 'Internal server error.' });
//   }
// })

// // fetch single demo booking of store
// router.post('/demoBookings/single', async (req, res) => {
//   try {
//     const { cred, bookingData } = req.body;

//     const store = await Store.findOne({ phone: cred.phone });
//     if (!store) return res.status(400).json({ error: 'Could not find store.' });
//     else {
//       const demobooking = await demoBooking.findOne({ _id: bookingData._id })
//       if (!demobooking) return res.status(500).json({ error: 'Internal server error.' });
//       else return res.status(200).json({ demobooking: demobooking });
//     }
//   }
//   catch (error) {
//     handleError(error);
//     return res.status(500).json({ error: 'Internal server error.' });
//   }
// })

// // fetch all archived demo bookings of store
// router.post('/demoBookings/all/archived', async (req, res) => {
//   try {
//     const { cred } = req.body;
//     const now = new Date();

//     const store = await Store.findOne({ phone: cred.phone });
//     let archivedemobookings = store.archiveDemoBookings;

//     const toArchivedemobookings = await demoBooking.find({ store: store._id });
//     toArchivedemobookings.forEach(async (archivedemo) => {
//       if (archivedemo.startTime.getTime() < now.getTime() + (75 * 60 * 1000)) {
//         console.log('archivedemo ==>\n', archivedemo.demoName, archivedemo._id)
//         let archivedemobooking = await archiveDemoBooking.findOne({ demoId: archivedemo._id })
//         if (!archivedemobooking) {
//           const archiveDemoData = {
//             demoId: archivedemo._id,
//             demoName: archivedemo.demoName,
//             demoDate: archivedemo.demoDate,
//             description: archivedemo.description,
//             startTime: archivedemo.startTime,
//             capacity: archivedemo.capacity,
//             tags: archivedemo.tags,
//             customers: archivedemo.customers,
//             store: store._id
//           }
//           archivedemobooking = await archiveDemoBooking.create(archiveDemoData);
//           // await demoBooking.findOneAndDelete({ _id: bookingData._id }, { multi: true });
//           await Store.findOneAndUpdate({ phone: store.phone }, {
//             $push: {
//               archiveDemoBookings: archivedemobooking._id
//             },
//             $pull: {
//               demoBookings: archivedemo._id
//             },
//           })
//         }
//       }
//     })

//     return res.status(500).json({ archivedemos: [...archivedemobookings, ...toArchivedemobookings] });
//   }
//   catch (error) {
//     handleError(error);
//     return res.status(500).json({ error: 'Internal server error.' });
//   }
// })

// // fetch single archuved demo booking of store
// router.post('/demoBookings/single', async (req, res) => {
//   try {
//     const { cred, bookingData } = req.body;

//     const store = await Store.findOne({ phone: cred.phone });
//     if (!store) return res.status(400).json({ error: 'Could not find store.' });
//     else {
//       const archivedemobooking = await archiveDemoBooking.find({ id: bookingData._id })
//       if (!archivedemobooking) return res.status(500).json({ error: 'Internal server error.' });
//       else return res.status(200).json({ archivedemobooking: archivedemobooking });
//     }
//   }
//   catch (error) {
//     handleError(error);
//     return res.status(500).json({ error: 'Internal server error.' });
//   }
// })

module.exports = router;
