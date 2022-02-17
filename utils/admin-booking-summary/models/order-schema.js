const mongoose = require('mongoose');

const { Schema } = mongoose;
// global date format - YYYY-MM-DDTHH:MM:SS
// seconds can be omitted

const orderSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    paymentId: {
        type: String,
        default: null,
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'paid'],
    },
    quantity: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    variant: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Orders', orderSchema, 'orders');
// name, schema, collection