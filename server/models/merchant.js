const Mongoose = require('mongoose');

const { MERCHANT_STATUS } = require('../constants');

const { Schema } = Mongoose;

// A submitted merchant application. This is distinct from the User account
// a merchant logs in with — approving one (routes/api/merchant.js) either
// upgrades an existing User's role or creates a brand-new one, and links
// that User back to this Merchant record via User.merchant.
const MerchantSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  brandName: {
    type: String
  },
  business: {
    type: String,
    trim: true
  },
  // False until approved (and stays false if later deactivated by an admin).
  isActive: {
    type: Boolean,
    default: false
  },
  // Set once the application is approved and a Brand is created for them.
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  status: {
    type: String,
    default: MERCHANT_STATUS.Waiting_Approval,
    enum: [
      MERCHANT_STATUS.Waiting_Approval,
      MERCHANT_STATUS.Rejected,
      MERCHANT_STATUS.Approved
    ]
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Merchant', MerchantSchema);
