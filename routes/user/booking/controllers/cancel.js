const router = require('express').Router();
const handleError = require('../../../../error_handling/handler');
const User = require('../../../../models/entities/user-schema');
const Store = require('../../../../models/entities/store-schema');
const Archivebooking = require('../../../../models/operations/archive-booking-schema');
const Booking = require('../../../../models/operations/booking-schema');
const verifySession = require('../../auth/verifySession');
const fillSlots = require('./slots');
const saveNewNotification = require('../../../../utils/notification-constructor');
const { dispatchSingleNotification, dispatchSingleNotificationApple } = require('../../../../utils/notification-dispatcher');

const createNewArchiveBooking = async (bookingData, status = 'cancelled') =>
  new Promise((resolve, reject) => {
    const archiveBooking = {
      store: bookingData.store,
      user: bookingData.user,
      bookingId: bookingData.bookingId,
      start: bookingData.start,
      end: bookingData.end,
      visitors: bookingData.visitors,
      assistance: bookingData.assistance,
      review: bookingData.review,
      status,
      type: bookingData.type,
    };

    // eslint-disable-next-line no-prototype-builtins
    if (bookingData.hasOwnProperty('product_name')) {
      archiveBooking.product_name = bookingData.product_name;
    }
    const newArchive = new Archivebooking(archiveBooking);

    newArchive.save((err, archiveBooking) => {
      if (err) reject(err);
      else resolve(archiveBooking);
    });
  });

const updateUserBookingDataAndSendNotification = async (
  bookingData,
  archiveBooking
) =>
  new Promise((resolve, reject) => {
    User.findOneAndUpdate(
      { _id: bookingData.user },
      { $push: { archiveBookings: archiveBooking } },
      (err, _updatedUser) => {
        if (err) reject(err);
        else {
          User.findOneAndUpdate(
            { _id: bookingData.user },
            { $pull: { bookings: bookingData._id } },
            (err, user) => {
              if (err) reject(err);
              else resolve(user);
            }
          );
        }
      }
    );
  });

const updateStoreBookingDataAndSendNotification = (
  bookingData,
  archiveBooking
) =>
  new Promise((resolve, reject) => {
    Store.findOneAndUpdate(
      { _id: bookingData.store },
      { $push: { archiveBookings: archiveBooking } },
      (err, _updatedUser) => {
        if (err) reject(err);
        else {
          Store.findOneAndUpdate(
            { _id: bookingData.store },
            { $pull: { bookings: bookingData._id } }
          )
            .populate('business', 'display_name logo')
            .exec((err, store) => {
              if (err) reject(err);
              else resolve(store);
            });
        }
      }
    );
  });

const deleteBookingFromTable = (id) =>
  new Promise((resolve, reject) => {
    console.log(2);
    Booking.findOneAndDelete({ _id: id }, (err, _doc) => {
      if (err) reject(err);
      else resolve();
    });
  });

// cancel a booking
router.post('/', verifySession, (req, res) => {
  const { bookingData } = req.body;
  let store;
  let user;

  createNewArchiveBooking(bookingData)
    .then((archiveBooking) => {
      updateUserBookingDataAndSendNotification(bookingData, archiveBooking._id)
        .then((userSaved) => {
          user = userSaved;
          updateStoreBookingDataAndSendNotification(bookingData, archiveBooking._id)
            .then((storeSaved) => {
              store = storeSaved;
              bookingData.visitors = -bookingData.visitors;
              fillSlots(bookingData)
                .then(() => {
                  console.log(1);
                  deleteBookingFromTable(bookingData._id)
                    .then(() => {
                      const dateOptions = {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      };
                      const displayDate = new Date(
                        archiveBooking.start
                      ).toLocaleDateString('en-US', dateOptions);

                      const title = 'Booking Cancelled';
                      const storeText = `${user.firstName} ${user.lastName} have cancelled their booking scheduled for ${displayDate}`;
                      const userText = `Your booking with ${store.business.display_name} ${store.name} has been cancelled`;

                      res
                        .status(200)
                        .json({ response: 'Booking deleted successfully' });

                      saveNewNotification(
                        title,
                        userText,
                        store.business.logo,
                        user._id,
                        null,
                        archiveBooking._id
                      );
                      saveNewNotification(
                        title,
                        storeText,
                        store.business.logo,
                        null,
                        store._id,
                        archiveBooking._id
                      );
                      dispatchSingleNotification(
                        user.firebaseToken,
                        title,
                        userText,
                        { booking: archiveBooking._id.toString(),type: 'booking-60' }
                      );
                      dispatchSingleNotification(
                        store.firebaseToken,
                        title,
                        storeText,
                        { booking: archiveBooking._id.toString(),type: 'booking-60' }
                      );
                      dispatchSingleNotificationApple(
                        user.deviceToken,
                        title,
                        userText,
                        { booking: archiveBooking._id.toString(), type: 'booking-60' }
                      );
                      dispatchSingleNotificationApple(
                        store.deviceToken,
                        title,
                        storeText,
                        { booking: archiveBooking._id.toString(), type: 'booking-60' }
                      );
                    })
                    .catch((e) => {
                      handleError(e);
                      console.log('Error updating booking');
                      res.status(500).json({ error: 'Error updating booking' });
                    });
                })
                .catch((e) => {
                  console.log(e);
                  handleError(e);
                  res.status(500).json({ error: 'Error filling slots' });
                });
            })
            .catch((e) => {
              handleError(e);
              console.log('Error updating store');
              res.status(500).json({ error: 'Error updating store' });
            });
        })
        .catch((e) => {
          handleError(e);
          console.log('Error updating user');
          res.status(500).json({ error: 'Error updating user' });
        });
    })
    .catch((e) => {
      handleError(e);
      console.log('Error updating archive');
      res.status(500).json({ error: 'Error creating archive' });
    });
});

module.exports = router;
