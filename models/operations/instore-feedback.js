const mongoose = require('mongoose');
const { Schema } = mongoose;

const instoreFeedbackSchema = new Schema({
  store: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  bookingType: {
    type: String,
    default: 'in-store',
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
    maskMandatory: Schema.Types.Boolean,
    noTouchPacking: Schema.Types.Boolean,
    assistance: Schema.Types.Boolean
  }
});

module.exports = mongoose.model('InstoreFeedback', instoreFeedbackSchema, 'instoreFeedback');

// make diff feedback DBs for in-store and video-calling?