const mongoose = require('mongoose');

const { Schema } = mongoose;

// global date format - YYYY-MM-DDTHH:MM:SS
// seconds can be omitted

const userSchema = new Schema({
  phone: {
    type: Number,
    required: true,
    unique: true,
    dropDups: false,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: String,
  email: String,
  age: Number,
  gender: String,

  bookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
  ],
  archiveBookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Archivebooking',
    },
  ],
  location: {
    lat: Number,
    long: Number,
  },
  firstTimeLogin: { type: Boolean, default: true },
  avatar: { type: String },
  notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  notificationHistory: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  searchHistory: [{ type: Schema.Types.ObjectId, ref: 'Search' }],
  storeHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
  ],
  favouriteStores: [{ type: Schema.Types.ObjectId, ref: 'Store' }],

  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  // auth
  _signingKey: { type: Buffer },
  firebaseToken: { type: String },
});

// Index the phone number
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema, 'users');
// name, schema, collection
