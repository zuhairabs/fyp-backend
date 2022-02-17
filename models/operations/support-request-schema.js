const mongoose = require('mongoose');

const { Schema } = mongoose;

const supportRequestSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
  },
  generated: {
    type: Date,
    default: () => Date.now(),
  },
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model(
  'SupportRequest',
  supportRequestSchema,
  'support-requests'
);
// name, schema, collection
