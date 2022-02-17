const mongoose = require('mongoose');

const { Schema } = mongoose;

// global date format - YYYY-MM-DDTHH:MM:SS
// seconds can be omitted

const browsingSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  start: {
    type: Date,
    required: true,
    default: () => Date.now(),
  },
  visited: [
    {
      url: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
      },
    },
  ],
});

module.exports = mongoose.model(
  'BrowsingSession',
  browsingSessionSchema,
  'sessions'
);
// name, schema, collection
