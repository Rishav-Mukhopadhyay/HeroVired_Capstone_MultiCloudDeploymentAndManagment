// Duplicated (trimmed) from commerce_server/models/merchant.js, which owns
// this collection. identity_server only needs this registered so
// routes/api/user.js's `/me` populate chain (User -> merchant -> brand)
// works — it never writes to this collection. Same shared MongoDB database,
// not a data copy.
const Mongoose = require('mongoose');

const { MERCHANT_STATUS } = require('../constants');

const { Schema } = Mongoose;

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
  isActive: {
    type: Boolean,
    default: false
  },
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
