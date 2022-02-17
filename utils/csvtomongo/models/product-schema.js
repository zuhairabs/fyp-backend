const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  tag: {
    type: ObjectId,
    ref: 'Tag',
  },
});

module.exports = mongoose.model('Product', productSchema, 'products');
