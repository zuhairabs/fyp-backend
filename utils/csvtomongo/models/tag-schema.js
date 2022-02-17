const mongoose = require("mongoose");

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

module.exports = mongoose.model("Tag", tagSchema, "tags");
