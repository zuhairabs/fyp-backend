const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const tagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    index: true,
  },
  // related tags
  related: [{ type: String }],
});

tagSchema.plugin(mongoosastic);

const Tag = mongoose.model('Tag', tagSchema, 'tags');

// FOR CREATING ELASTIC SEARCH INDEXING

// const stream = Tag.synchronize();
// let count = 0;

// stream.on('data', (err, doc) => {
//   if (err) {
//     return console.log(err);
//   }
//   count++;
// });
// stream.on('close', () => {
//   console.log(`indexed ${count} tag documents!`);
// });
// stream.on('error', (err) => {
//   console.log(err);
// });

module.exports = Tag;
