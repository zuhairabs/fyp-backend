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
  review: { type: Schema.Types.ObjectId, ref: 'Review' },
  status: { type: String, default: 'upcoming' },
  // status can be "completed", "cancelled", "upcoming", "missed"
});

module.exports = mongoose.model(
  'Archivebooking',
  archiveBookingSchema,
  'archivebookings'
);
// name, schema, collection
