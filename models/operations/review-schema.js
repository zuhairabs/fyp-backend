const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  store: { type: Schema.Types.ObjectId, ref: 'Store' },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  params: [
    {
      title: String,
      score: Number,
    },
  ],
  comment: String,
});

module.exports = mongoose.model('Review', reviewSchema, 'reviews');
