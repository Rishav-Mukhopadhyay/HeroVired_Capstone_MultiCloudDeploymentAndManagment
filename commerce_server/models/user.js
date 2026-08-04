// Duplicated (trimmed) from identity_server/models/user.js, which owns this
// collection. commerce_server needs this registered for its own auth
// middleware (every authenticated request looks the user up by id) and for
// merchant.js's User lookups/updates when approving a merchant application.
// Same shared MongoDB database, not a data copy.
const Mongoose = require('mongoose');

const { ROLES, EMAIL_PROVIDER } = require('../constants');

const { Schema } = Mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    required: () => {
      return this.provider !== 'email' ? false : true;
    }
  },
  phoneNumber: {
    type: String
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  password: {
    type: String
  },
  merchant: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null
  },
  provider: {
    type: String,
    required: true,
    default: EMAIL_PROVIDER.Email
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    default: ROLES.Member,
    enum: [ROLES.Admin, ROLES.Member, ROLES.Merchant]
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('User', UserSchema);
