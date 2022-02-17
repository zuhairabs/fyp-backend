const mongoose = require('mongoose');

const { Schema } = mongoose;
// global date format - YYYY-MM-DDTHH:MM:SS
// seconds can be omitted

const productSchema = new Schema({
    name: {
        type: String
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'demobooking',

        required: true,
    },
    image: { type: String },
    desc: { type: String },
    quantity: {
        type: Number,
        default: 10
    },
    price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    deliveryCharge: {
        type: Number,
        required: true
    },
    variants: [{
        type: String
    }],
    cgst: {
        type: Number,
        required: true
    },
    sgst: {
        type: Number,
        required: true
    },
    remark: {
        type: String
    },
});

module.exports = mongoose.model('Products', productSchema, 'products');