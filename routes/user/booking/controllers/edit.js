const router = require('express').Router();
const handleError = require('../../../../error_handling/handler');
const User = require('../../../../models/entities/user-schema');
const Archivebooking = require('../../../../models/operations/archive-booking-schema');
const verifySession = require('../../auth/verifySession');

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

// edit an existing booking
router.post('/', verifySession, (req, res) => {
  const { bookingData } = req.body;
  createNewArchiveBooking(bookingData, 'edited').then(() => {
    User.findOneAndUpdate(
      {
        phone: req.body.cred.phone,
      },
      {
        $pull: { bookings: bookingData._id },
      },
      (err, user) => {
        if (err) {
          handleError(err);
          return res.status(500).json({ error: 'Internal Server error' });
        }

        return res.status(200).json({ status: 'Booking deleted.' });
      }
    );
  });
});

module.exports = router;
