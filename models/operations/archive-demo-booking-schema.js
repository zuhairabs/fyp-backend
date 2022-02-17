const mongoose = require('mongoose')
const { Schema } = mongoose

const archiveDemoBookingSchema = new Schema({
  demoId: {
    type: Schema.Types.ObjectId,
    ref: 'DemoBooking'
  },
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business'
    // required: true
  },
  store: {
    type: Schema.Types.ObjectId,
    ref: 'Store'
  },
  demoName: {
    type: String,
    required: true
  },
  demoDate: {
    type: Date,
    required: true
  },
  image: { type: String },
  description: {
    type: String
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
        ref: 'User'
        // required: true
      },
      interested: {
        type: Boolean,
        // required: true,
        default: false
      },
      status: {
        type: String,
        // required: true,
        default: 'Cancelled',
        // enum: ['Cancelled', 'Missed']
      },
      timestamp: {
        type: Date
        // required: true
      }
    }
  ],
})

module.exports = mongoose.model('ArchiveDemoBooking', archiveDemoBookingSchema, 'archivedemobookings')
// name, schema, collection

// Business name -- made is business ID as asked.
// Buy now link -- not yet done, implement later
