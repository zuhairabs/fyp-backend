const 
    mongoose = require("mongoose"),
    Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        dropDups: false
    },
        businesses: [{type: Schema.Types.ObjectId, ref:"Business"}]
});

module.exports = mongoose.model("Brand", brandSchema, "brands")