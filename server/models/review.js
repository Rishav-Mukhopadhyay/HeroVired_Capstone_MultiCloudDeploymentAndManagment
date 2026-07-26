const Mongoose = require('mongoose');

const { REVIEW_STATUS } = require('../constants');

const { Schema } = Mongoose;

// A buyer's review of a Product. Goes through moderation (`status`) before
// it's visible on the storefront — see REVIEW_STATUS in constants/index.js.
const ReviewSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    trim: true
  },
  // Star rating, e.g. 1-5.
  rating: {
    type: Number,
    default: 0
  },
  review: {
    type: String,
    trim: true
  },
  // "Would you recommend this product?" — separate from the numeric rating.
  isRecommended: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    default: REVIEW_STATUS.Waiting_Approval,
    enum: [
      REVIEW_STATUS.Waiting_Approval,
      REVIEW_STATUS.Rejected,
      REVIEW_STATUS.Approved
    ]
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Review', ReviewSchema);
