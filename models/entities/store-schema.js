const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const storeSchema = new Schema({
  // credentials
  phone: {
    type: Number,
    required: true,
    unique: true,
    dropDups: false,
  },
  password: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    required: true,
    index: true,
    es_indexed: true,
  },
  business: {
    type: ObjectId,
    ref: 'Business',
  },
  category: {
    type: String,
    es_indexed: true,
  },
  oldCategory: String,
  products: [{ type: String, es_indexed: false }],
  tags: [{ type: String, es_indexed: true }],
  city: { type: String, es_indexed: true },

  // flags for video/store appointment
  virtual_enabled: { type: Boolean, default: false },
  physical_enabled: { type: Boolean, default: true },

  capacity: {
    type: Number,
  },
  video_capacity: {
    type: Number,
    default: this.capacity,
  },
  working_days: [Number],
  // customer handling time
  slots: [
    {
      startTime: { type: Date, unique: true, dropDups: false },
      duration: { type: Number, default: 30 },
      filled: { type: Number, default: 0 },
      capacityFull: { type: Boolean, default: false },
    },
  ],
  video_slots: [
    {
      startTime: { type: Date, unique: true, dropDups: false },
      duration: { type: Number, default: 30 },
      filled: { type: Number, default: 0 },
      capacityFull: { type: Boolean, default: false },
    },
  ],

  // store details
  description: String,
  active_hours: [
    {
      start: String,
      end: String,
    },
  ],
  location_desc: { type: String },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [Number],
  },
  parameters: [
    {
      title: String,
      rating: {
        type: Number,
        default: 0,
      },
      numberOfRatings: {
        type: Number,
        default: 0,
      },
    },
  ],
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],
  avg_rating: Number,
  notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  notificationHistory: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],

  // add name of the mall
  // pictures can be added by gridFS

  // manager view
  bookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
  ],
  archiveBookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ArchiveBooking',
    },
  ],
  demoBookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'DemoBooking',
    }
  ],
  archiveDemoBookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ArchiveDemoBooking',
    },
  ],
  // auth
  _signingKey: { type: Buffer },
  firebaseToken: { type: String },
  deviceToken: {type: String}
});

// Create geoSpatial Indexing
storeSchema.index({ location: '2dsphere' });

const Store = mongoose.model('Store', storeSchema, 'stores');

module.exports = Store;
