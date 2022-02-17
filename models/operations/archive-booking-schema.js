const mongoose = require('mongoose');

const { Schema } = mongoose;

// global date format - YYYY-MM-DDTHH:MM:SS
// seconds can be omitted

const archiveBookingSchema = new Schema({
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
  bookingId: String,
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
  durations: {
    type: [{type: Number}],
    default: []
  }
});

module.exports = mongoose.model(
  'Archivebooking',
  archiveBookingSchema,
  'archivebookings'
);
// name, schema, collection
