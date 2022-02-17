const
    mongoose = require("mongoose"),
    Schema = mongoose.Schema;

const businessSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        dropDups: false
    },
    phone:{
        type: Number,
        required: true
    },
    email:{
        type: String
    },
    password: {
        type: String,
        required: true
    },
    logo: {
        type: String
    },
    display_name:{
        type: String
    },
    description:{
        type: String
    },
    title_image: String,
    images: [],
    category: String,
    tags: [
        {
            type: String
        }
    ],
    brands: [
        {
            type: String
        }
    ],
    stores: [
        {
            type: Schema.Types.ObjectId,
            ref: "Store",
        }
    ]
});

module.exports = mongoose.model("Business", businessSchema, "businesses")
