const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const alphabet = 'abcdefghijklmnopqrstuvwxyz1234567890';
const nanoid = customAlphabet(alphabet, 7);

const { Schema } = mongoose;

// global date format - YYYY-MM-DDTHH:MM:SS
// seconds can be omitted

const bookingSchema = new Schema({
  store: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: String,
    default: nanoid().toUpperCase(),
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  visitors: {
    type: Number,
    required: true,
    default: 1,
  },
  assistance: {
    type: Boolean,
    required: true,
    default: false,
  },
  type: {
    type: String,
    default: 'walk-in',
    enum: ['walk-in', 'virtual'],
  },
  product_name: {
    type: String,
  },
  review: { type: Schema.Types.ObjectId, ref: 'Review' },
  status: {
    type: String,
    default: 'upcoming',
    enum: ['cancelled', 'upcoming', 'missed', 'completed'],
  },
  // status can be "completed", "cancelled", "upcoming", "missed"
});

module.exports = mongoose.model('Booking', bookingSchema, 'bookings');
// name, schema, collection
