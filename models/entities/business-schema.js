const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

const { Schema } = mongoose;

const businessSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: false,
  },
  phone: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
  },
  display_name: {
    type: String,
  },
  images: [],
  category: String,
  oldCategory: String,
  tags: [
    {
      type: String,
    },
  ],
  stores: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
  ],
});

businessSchema.index({ tags: 1 });
businessSchema.index({ brands: 1 });
businessSchema.index('category');
businessSchema.plugin(mongoosastic);

const Business = mongoose.model('Business', businessSchema, 'businesses');

// const stream = Business.synchronize();
// let count = 0;

// stream.on('data', (err, doc) => {
//   if (err) {
//     return console.log(err);
//   }
//   count++;
// });
// stream.on('close', () => {
//   console.log(`indexed ${count} business documents!`);
// });
// stream.on('error', (err) => {
//   console.log(err);
// });

module.exports = Business;
