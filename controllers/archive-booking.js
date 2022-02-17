const ArchiveBooking = require('../models/operations/archive-booking-schema');
const Booking = require('../models/operations/booking-schema');
const User = require('../models/entities/user-schema');
const Store = require('../models/entities/store-schema');

const saveToUser = async (booking, archived) => {
  await User.findOneAndUpdate(
    { _id: archived.user },
    {
      $push: { archiveBookings: archived._id },
    }
  );
  await User.findOneAndUpdate(
    { _id: archived.user },
    { $pull: { bookings: booking._id } }
  );
};

const saveToStore = async (booking, archived) => {
  await Store.findOneAndUpdate(
    { _id: archived.store },
    {
      $push: { archiveBookings: archived._id },
    }
  );
  await Store.findOneAndUpdate(
    { _id: archived.store },
    {
      $pull: { bookings: booking._id },
    }
  );
};

const deleteOldBooking = async (booking) => {
  await Booking.findByIdAndDelete(booking._id);
};

const createArchiveBooking = (booking, status) =>
  new Promise((resolve, reject) => {
    /* 1. create new archived booking
      2. save archive booking to store and user collection
      3. pull existing booking from store and user collection
    */
    const archiveBooking = new ArchiveBooking({
      store: booking.store,
      user: booking.user,
      bookingId: booking.bookingId,
      start: booking.start,
      end: booking.end,
      visitors: booking.visitors,
      assistance: booking.assistance,
      review: booking.review,
      type: booking.type,
      status: (booking.status.localeCompare('upcoming')==0)?status:booking.status,
    });
    archiveBooking.save(async (err, archived) => {
      if (err) reject(err);
      else {
        try {
          await saveToUser(booking, archived);
          await saveToStore(booking, archived);
          await deleteOldBooking(booking);
          resolve(archived._id);
        } catch (e) {
          reject(e);
        }
      }
    });
  });

module.exports = createArchiveBooking;
