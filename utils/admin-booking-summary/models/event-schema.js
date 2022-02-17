const mongoose = require('mongoose')
const { customAlphabet } = require('nanoid')

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const nanoid = customAlphabet(alphabet, 7)
const { Schema } = mongoose

const demoBookingSchema = new Schema({
    demoId: {
        type: String,
        default: () => nanoid()
    },
    business: {
        type: Schema.Types.ObjectId,
        ref: 'Business'
        // required: true
    },
    demoName: {
        type: String,
        required: true
    },
    demoDate: {
        type: Date,
        required: true
    },
    images: [],

    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 20
    },
    startTime: {
        type: Date,
        required: true
    },
    capacity: {
        type: Number,
        // required: true,
        default: 30
    },
    tags: [
        {
            type: String
        }
    ],
    customers: [
        {
            _id: false,
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            interested: {
                type: Boolean,
                // required: true,
                default: false
            },
            status: {
                type: Boolean,
                // required: true,
                default: false
            },
            timestamp: {
                type: Date
                // required: true
            }
        }
    ],
    channelName: {
        type: String,
        default: () => nanoid()
    }
})

module.exports = mongoose.model('demobooking', demoBookingSchema, 'demobookings')
// name, schema, collection