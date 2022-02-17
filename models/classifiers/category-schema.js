const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: false,
    index: true,
  },
  // related tags if any
  businesses: [{ type: ObjectId, ref: 'Business' }],
  videos: [{ type: ObjectId, ref: 'Video' }],
  tag: [{type: String}]
});

const Category = mongoose.model('Category', categorySchema, 'categories');

module.exports = Category;
