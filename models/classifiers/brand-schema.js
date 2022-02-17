const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const brandSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: false,
    index: true,
  },
  businesses: [
    {
      type: ObjectId,
      ref: 'Business',
    },
  ],
  tag: {
    type: ObjectId,
    ref: 'Tag',
  },
});

const Brand = mongoose.model('Brand', brandSchema, 'brands');

module.exports = Brand;
