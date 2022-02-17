const mongoose = require('mongoose');

const { Schema } = mongoose;

const searchSchema = new Schema({
  query: {
    type: String,
    required: true,
  },
  user: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: () => Date.now(),
  },
  // type involves tag, brand, category or store search
  model: {
    type: String,
  },
  location: {
    type: String,
  },
});

module.exports = mongoose.model('Search', searchSchema, 'searches');
