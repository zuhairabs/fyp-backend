const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const videoSchema = new Schema({
  source: {
    type: String,
    required: true,
  },
  tags: [
    {
      type: String,
    },
  ],
  searchTag: {
    type: String,
  },
  business: {
    type: ObjectId,
    ref: 'Business',
  },
  category: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  link: {
    type: String,
  },
  likes: {
    type: Number,
    default: 0,
  },
  dislikes: {
    type: Number,
    default: 0,
  },
  created: {
    type: Date,
    default: () => Date.now(),
  },
});

module.exports = mongoose.model('Video', videoSchema, 'videos');
