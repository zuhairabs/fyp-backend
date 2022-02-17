const schedule = require('node-schedule');

const Booking = require('../models/operations/booking-schema');
const DemoBooking = require('../models/operations/demo-booking-schema');
const Notification = require('../models/operations/notification-schema');
const User = require('../models/entities/user-schema');
const RTCUser = require('../models/entities/rtc-user-schema');
const createArchiveBooking = require('../controllers/archive-booking');
const { dispatchSingleNotification, dispatchSingleNotificationApple } = require('./notification-dispatcher');
const saveNewNotification = require('./notification-constructor');
const handleError = require('../error_handling/handler');

const HOUR = 60 * 60 * 1000;
const formatDate = (dateString) => {
  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timezone: 'Asia/Kolkata',
  };
  return new Date(dateString).toLocaleDateString('en-US', dateOptions);
};

const formatTime = (dateString) =>
  new Date(dateString.getTime() + 5.5 * 60 * 60 * 1000).toLocaleTimeString(
    'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
      timezone: 'Asia/Kolkata',
    }
  );

const findBookings = (gt, lt) =>
  new Promise((resolve, reject) => {
    Booking.find({ start: { $gte: gt, $lt: lt } })
      .populate({
        path: 'user',
        select: '_id firebaseToken deviceToken',
      })
      .populate({
        path: 'store',
        select: '_id name business firebaseToken deviceToken',
        populate: {
          path: 'business',
          select: 'display_name name logo',
        },
      })
      .exec((err, bookings) => {
        if (err) {
          handleError(err);
          reject(err);
        } else resolve(bookings);
      });
  });

const findDemoBookings = (gt, lt) =>
  new Promise((resolve, reject) => {
    DemoBooking.find({ startTime: { $gte: gt, $lt: lt } })
      .populate(
        'customers.user',
        '_id firebaseToken deviceToken'
      )
      .populate({
        path: 'business',
        select: 'display_name name logo stores',
        populate: {
          path: 'stores',
          select: '_id name business firebaseToken deviceToken',
        },
      })
      .exec((err, demobookings) => {
        if (err) {
          handleError(err);
          reject(err);
        } else resolve(demobookings);
      });
  });

const findBookingsForMissed = (gt, lt) =>
  new Promise((resolve, reject) => {
    Booking.find({ end: { $gte: gt, $lt: lt } })
      .populate({
        path: 'user',
        select: '_id firebaseToken deviceToken',
      })
      .populate({
        path: 'store',
        select: '_id name business firebaseToken deviceToken',
        populate: {
          path: 'business',
          select: 'display_name name logo',
        },
      })
      .exec((err, bookings) => {
        if (err) {
          handleError(err);
          reject(err);
        } else resolve(bookings);
      });
  });


const sendUpcomingBookingNotification = (booking, type) => {
  /**
   * 1. construct notification
   * 2. find user's firebase token
   * 3. use notification dispatcher to push and save notifications
   */
  const storeName = `${booking.store.business.display_name} ${booking.store.name}`;
  const title = 'Upcoming booking';
  let body = `Your booking with ${storeName} is due at ${formatTime(booking.start)}. Hope you have an amazing experience.`;
  if (type.localeCompare('booking-15') == 0)
    body += ` Happy Shopouting.`;
  dispatchSingleNotification(booking.user.firebaseToken, title, body, {
    booking: booking._id.toString(),
    archived: '',
    type: type
  });
  dispatchSingleNotification(booking.store.firebaseToken, title, `Your booking with a user is due at ${formatTime(booking.start)}.`, {
    booking: booking._id.toString(),
    archived: 'false',
    type: type
  });
  dispatchSingleNotificationApple(booking.user.deviceToken, title, body, {
    booking: booking._id.toString(),
    archived: 'false',
    type: type
  });
  dispatchSingleNotificationApple(booking.store.deviceToken, title, `Your booking with a user is due at ${formatTime(booking.start)}. Happy Selling.`, {
    booking: booking._id.toString(),
    archived: 'false',
    type: type
  });
  saveNewNotification(
    title,
    body,
    booking.store.business.logo,
    booking.user._id,
    null,
    booking._id
  );
  saveNewNotification(
    title,
    `Your booking with a user is due at ${formatTime(booking.start)}.`,
    booking.store.business.logo,
    null,
    booking.store._id,
    booking._id
  );
};

const sendUpcomingBookingNotificationOnlyStore = (booking) => {
  /**
   * 1. construct notification
   * 2. find user's firebase token
   * 3. use notification dispatcher to push and save notifications
   */
  const storeName = `${booking.store.business.display_name} ${booking.store.name}`;
  const title = 'Upcoming booking';
  const body = `Your booking with a user is due at ${formatTime(booking.start)}. Happy Selling.`;
  dispatchSingleNotification(booking.store.firebaseToken, title, body, {
    booking: booking._id.toString(),
    archived: 'false',
    type: 'booking-1'
  });
  dispatchSingleNotificationApple(booking.store.deviceToken, title, body, {
    booking: booking._id.toString(),
    archived: 'false',
    type: 'booking-1'
  });
  saveNewNotification(
    title,
    `Your booking with a user is due at ${formatTime(booking.start)}. Happy Selling.`,
    booking.store.business.logo,
    null,
    booking.store._id,
    booking._id
  );
};

const sendUpcomingDemoBookingNotification = (demobooking, type) => {
  /**
   * 1. construct notification
   * 2. find user's firebase token
   * 3. use notification dispatcher to push and save notifications
   */
  const demoName = `${demobooking.demoName}`;
  const title = 'Upcoming Live Event in 60 minutes.';
  let body = `Live demo for ${demoName} starts at ${formatTime(demobooking.startTime)}. Hope it comes to your use!.`;

  const customers = demobooking.customers;
  const business = demobooking.business;

  customers.forEach(customer => {
    dispatchSingleNotification(customer.user.firebaseToken, title, body, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });
    dispatchSingleNotificationApple(customer.user.deviceToken, title, body, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });
    saveNewNotification(
      title,
      body,
      business.logo,
      customer.user._id,
      null,
      demobooking._id
    );
  })

  business.stores.forEach((store) => {
    dispatchSingleNotification(store.firebaseToken, title, `Your business has a live event at ${formatTime(demobooking.startTime)}.`, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });
    dispatchSingleNotificationApple(demobooking.store.deviceToken, title, `Your business has a live event at ${formatTime(demobooking.startTime)}. Happy Selling.`, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });

    saveNewNotification(
      title,
      `${demoName} live event starting at ${formatTime(demobooking.startTime)}.`,
      business.logo,
      null,
      store._id,
      demobooking._id
    );
  })
};

const sendUpcomingDemoBookingNotificationOnlyUser = (demobooking, type) => {

  const demoName = `${demobooking.demoName}`;
  const title = 'Upcoming Live Event in 15 minutes';
  let body = `Live demo for ${demoName} starts at ${formatTime(demobooking.startTime)}. Hope it comes to your use!.`;

  const customers = demobooking.customers;

  customers.forEach(customer => {
    dispatchSingleNotification(customer.user.firebaseToken, title, body, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });
    dispatchSingleNotificationApple(customer.user.deviceToken, title, body, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });
    saveNewNotification(
      title,
      body,
      demobooking.business.logo,
      customer.user._id,
      null,
      demobooking._id
    );
  })
};

const sendUpcomingDemoBookingNotificationOnlyStore = (demobooking, type) => {

  const demoName = `${demobooking.demoName}`;
  const title = 'Upcoming Live Event in 60 minutes.';
  let body = `${demoName} live event starting at ${formatTime(demobooking.startTime)}.`;

  const business = demobooking.business;

  business.stores.forEach((store) => {
    dispatchSingleNotification(store.firebaseToken, title, `Your business has a live event at ${formatTime(demobooking.startTime)}.`, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });
    dispatchSingleNotificationApple(demobooking.store.deviceToken, title, `Your business has a live event at ${formatTime(dmeobooking.startTime)}. Happy Selling.`, {
      booking: demobooking._id.toString(),
      archived: 'false',
      type: type
    });

    saveNewNotification(
      title,
      body,
      business.logo,
      null,
      store._id,
      demobooking._id
    );
  })
};

const sendCallReminderNotificationOnlyStore = async (booking) => {
  const temp = await RTCUser.find({ channelName: booking.bookingId });

  if (booking.type.localeCompare('virtual') == 0 && temp.length == 0) {
    /**
     * 1. construct notification
     * 2. find user's firebase token
     * 3. use notification dispatcher to push and save notifications
     */
    const storeName = `${booking.store.business.display_name} ${booking.store.name}`;
    const title = 'Upcoming booking';
    const body = `You forgot the appointment at ${formatTime(booking.start)}, still possible to connect with Customer. Rush..`;
    dispatchSingleNotification(booking.store.firebaseToken, title, body, {
      booking: booking._id.toString(),
      archived: 'false',
      type: 'booking-1'
    });
    dispatchSingleNotificationApple(booking.store.deviceToken, title, body, {
      booking: booking._id.toString(),
      archived: 'false',
      type: 'booking-1'
    });
    saveNewNotification(
      title,
      `You forgot the appointment at ${formatTime(booking.start)}, still possible to connect with Customer. Rush..`,
      booking.store.business.logo,
      null,
      booking.store._id,
      booking._id
    );
  }
};

const findUpcomingBookings = () => {
  const time = new Date().getTime();
  const gt = new Date(time);
  const lt = new Date(time + 0.5 * HOUR);
  console.log(gt, lt);
  findBookings(gt, lt).then((bookings) => {
    console.log(bookings);
    bookings.forEach((booking) => sendUpcomingBookingNotification(booking, 'booking-15'));
  });
};

const findUpcomingBookingsShort = () => {
  const time = new Date().getTime();
  const gt = new Date(time);
  const lt = new Date(time + 0.25 * HOUR);
  console.log(gt, lt);
  findBookings(gt, lt).then((bookings) => {
    console.log(bookings);
    bookings.forEach((booking) => sendUpcomingBookingNotificationOnlyStore(booking));
  });
};

const findUpcomingBookingsLong = () => {
  const time = new Date().getTime();
  const gt = new Date(time + HOUR);
  const lt = new Date(time + 1.25 * HOUR);

  console.log(gt, lt);
  findBookings(gt, lt).then((bookings) => {
    console.log(bookings);
    bookings.forEach((booking) => sendUpcomingBookingNotification(booking, 'booking-60'));
  });
};

const findUpcomingBookingsForStore = () => {
  const time = new Date().getTime();
  const gt = new Date(time - 0.25 * HOUR);
  const lt = new Date(time);
  console.log(gt, lt);
  findBookings(gt, lt).then((bookings) => {
    console.log(bookings);
    bookings.forEach((booking) => sendCallReminderNotificationOnlyStore(booking));
  });
};

// 60 mins
const findUpcomingDemoBookings = () => {
  const time = new Date().getTime();
  const gt = new Date(time);
  const lt = new Date(time + 1 * HOUR);
  console.log(gt, lt);
  findDemoBookings(gt, lt).then((demobookings) => {
    console.log(demobookings);
    demobookings.forEach((demobooking) => sendUpcomingDemoBookingNotification(demobooking, 'demobooking-60'));
  });
};

// 15 mins
const findUpcomingDemoBookingsShort = () => {
  const time = new Date().getTime();
  const gt = new Date(time);
  const lt = new Date(time + 0.25 * HOUR);
  console.log(gt, lt);
  findDemoBookings(gt, lt).then((demobookings) => {
    console.log(demobookings);
    demobookings.forEach((demobooking) => sendUpcomingDemoBookingNotificationOnlyStore(demobooking, 'demobooking-15'));
  });
};

// 1 min
const findUpcomingDemoBookingsUserJoin = () => {
  const time = new Date().getTime();
  const gt = new Date(time);
  const lt = new Date(time + (60 * 1000));
  console.log(gt, lt);
  findDemoBookings(gt, lt).then((demobookings) => {
    console.log(demobookings);
    demobookings.forEach((demobooking) => sendUpcomingDemoBookingNotificationOnlyUser(demobooking, 'demobooking-1'));
  });
};

const sendMissedBookingNotification = async (booking) => {
  /**
   * 1. construct notification
   * 2. find user's firebase token
   * 3. createArchiveBooking then use notification dispatcher to push and save notifications
   */
  const date = formatDate(booking.start);
  const time = formatTime(booking.start);
  const storeName = `${booking.store.business.display_name} ${booking.store.name}`;
  const title = 'Booking Missed';
  const body = `You missed your booking scheduled for ${date}, ${time} with ${storeName}.`;
  const temp = booking;
  const temper = await RTCUser.find({ channelName: booking.bookingId });

  createArchiveBooking(booking, 'missed').then((archivedId) => {
    if (temp.status.localeCompare('upcoming') === 0) {
      if (temp.type.localeCompare('virtual') == 0 && temper.length == 0) {
        dispatchSingleNotification(temp.user.firebaseToken, title, "We are sorry the store did not call, we will look into it, do you want to check other retailers?", {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-missed'
        });
        dispatchSingleNotificationApple(temp.user.deviceToken, title, "We are sorry the store did not call, we will look into it, do you want to check other retailers?", {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-missed'
        });
        saveNewNotification(
          title,
          body,
          booking.store.business.logo,
          temp.user._id,
          null,
          archivedId,
          true
        );

        dispatchSingleNotification(temp.store.firebaseToken, title, "You did not call the customer, we are trying our best to reschedule the call again, please do not miss in future", {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-missed'
        });
        dispatchSingleNotificationApple(temp.store.deviceToken, title, "You did not call the customer, we are trying our best to reschedule the call again, please do not miss in future", {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-missed'
        });
        saveNewNotification(
          title,
          "You did not call the customer, we are trying our best to reschedule the call again, please do not miss in future",
          booking.store.business.logo,
          null,
          temp.store._id,
          archivedId,
          true
        );
      }
      else {
        dispatchSingleNotification(temp.user.firebaseToken, title, "You missed a booking, do you want to reschedule?", {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-missed'
        });
        dispatchSingleNotificationApple(temp.user.deviceToken, title, "You missed a booking, do you want to reschedule?", {
          booking: archivedId.toString(),
          archived: 'true',
          type: 'booking-missed'
        });
        saveNewNotification(
          title,
          "You missed a booking, do you want to reschedule?",
          booking.store.business.logo,
          temp.user._id,
          null,
          archivedId,
          true
        );
      }
    }
  });

};
const findMissedBookings = () => {
  const time = new Date().getTime();
  const gt = new Date(time - 2 * HOUR);
  const lt = new Date(time - HOUR);
  findBookingsForMissed(gt, lt).then((bookings) =>
    bookings.forEach((booking) => sendMissedBookingNotification(booking))
  );
};

const removeOldNotifications = () => {
  const lastDate = new Date(Date.now() / 1000 - 30 * 24 * 60 * 60);

  // Find all notifications which are a month older
  Notification.find({
    generatedTime: {
      $lte: lastDate,
    },
  }).exec((err, oldNotifications) => {
    if (err) {
      return handleError(err);
    }
    oldNotifications.forEach((notification) => {
      const userId = notification.user;

      // Send old notifs to user history & remove them from live notifs
      User.findByIdAndUpdate(userId, {
        $push: {
          notificationHistory: notification,
        },
        $pull: {
          notifications: notification,
        },
      }).exec((err, user) => {
        if (err) {
          return handleError(err);
        }
      });
    });
  });
};

const notificationScript = () => {
  // Notification scheduler to run every 30 minutes
  schedule.scheduleJob('15,45 * * * *', () => {
    findUpcomingBookings();
    findUpcomingDemoBookings()
  });

  schedule.scheduleJob('29,59 * * * *', () => {
    findUpcomingBookingsShort();
    findUpcomingBookingsLong();
    findMissedBookings();
    findUpcomingDemoBookingsShort();
    findUpcomingDemoBookingsUserJoin();
  });

  schedule.scheduleJob('5,35 * * * *', () => {
    findUpcomingBookingsForStore();
  });

  // Notification scheduler to run at 00:15 everyday
  schedule.scheduleJob('0 15 0 * * *', () => {
    removeOldNotifications();
  });
};

module.exports = notificationScript;