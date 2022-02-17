const mongoose = require('mongoose');

const { Schema } = mongoose;

// global date format - YYYY-MM-DDTHH:MM:SS
// seconds can be omitted

const notificationSchema = new Schema({
  title: {
    type: String,
    default: 'ShopOut',
    required: true,
  },
  subtitle: {
    type: String,
  },
  text: {
    type: String,
    required: true,
  },
  image: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  store: { type: Schema.Types.ObjectId, ref: 'Store' },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  archived: { type: Boolean, default: false },
  readStatus: { type: Boolean, default: false },
  generatedTime: { type: Date, default: () => Date.now() },
});

module.exports = mongoose.model(
  'Notification',
  notificationSchema,
  'notifications'
);
// name, schema, collection
