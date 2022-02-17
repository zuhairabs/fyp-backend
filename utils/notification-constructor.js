const Store = require('../models/entities/store-schema');
const User = require('../models/entities/user-schema');
const Notification = require('../models/operations/notification-schema');

const saveNewNotification = (
  title,
  text,
  image,
  user = null,
  store = null,
  booking = null,
  archived = false
) =>
  new Promise((resolve, reject) => {
    const newNotification = new Notification({
      title,
      text,
      image,
      user,
      store,
      booking,
      archived,
    });
    newNotification.save(async (err, savedNotification) => {
      if (err) reject(err);
      else {
        const id = savedNotification._id;
        if (user) {
          await User.findOneAndUpdate(
            { _id: user },
            { $push: { notifications: id } }
          );
        }
        if (store) {
          await Store.findOneAndUpdate(
            { _id: store },
            { $push: { notifications: id } }
          );
        }
        resolve();
      }
    });
  });

module.exports = saveNewNotification;
