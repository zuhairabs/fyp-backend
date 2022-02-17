const mongoose = require('mongoose');
const { Schema } = mongoose;

const virtualFeedbackSchema = new Schema({
  // callUseful: bool
  // relevantInfo: bool
  // callback: bool
  // booking: objectid
  // user: objectid
  // type: ['booking', 'demobooking']

  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  demobooking: {
    type: Schema.Types.ObjectId,
    ref: 'DemoBooking'
  },
  bookingType: {
    type: String,
    default: 'booking',
    enum: ['booking', 'demobooking'],
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date
  },
  userFeedback: {
    callUseful: Schema.Types.Boolean,
    relevantInfo: Schema.Types.Boolean,
    callback: Schema.Types.Boolean
  }
});

module.exports = mongoose.model('VirtualFeedback', virtualFeedbackSchema, 'virtualFeedback');