const mongoose = require('mongoose');

const RTCUserSchema = new mongoose.Schema(
  {
    ref_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['user', 'store'],
      required: true,
    },
    uid: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

RTCUserSchema.index({ channelName: 1, type: 1 });
RTCUserSchema.index({ channelName: 1, ref_id: 1 });

const RTCUser = mongoose.model('RTCUsers', RTCUserSchema, 'rtc-users');

module.exports = RTCUser;
