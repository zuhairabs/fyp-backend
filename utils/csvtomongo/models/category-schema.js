const mongoose = require("mongoose");

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
	businesses: [{ type: ObjectId, ref: "Business" }],
	icon: String,
	videos: [{ type: ObjectId, ref: "Video" }],
	tag: [{
		type: String
	}],
});

const Category = mongoose.model("Category", categorySchema, "categories");

// FOR CREATING ELASTIC SEARCH INDEXING

// const stream = Category.synchronize();
// let count = 0;

// stream.on('data', (err, doc) => {
//   if (err) {
//     return console.log(err);
//   }
//   count++;
// });
// stream.on('close', () => {
//   console.log(`indexed ${count} category documents!`);
// });
// stream.on('error', (err) => {
//   console.log(err);
// });

module.exports = Category;
