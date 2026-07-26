const Mongoose = require('mongoose');

const { ROLES, EMAIL_PROVIDER } = require('../constants');

const { Schema } = Mongoose;

// A logged-in account: buyer (default), merchant, or admin, distinguished by
// `role`. A merchant User is linked to its Merchant application/brand via
// `merchant`; buyers/admins leave it null.
const UserSchema = new Schema({
  email: {
    type: String,
    // NOTE: likely doesn't behave as intended. Arrow functions don't get
    // their own `this`, so `this.provider` here is NOT the document being
    // validated — it resolves against the outer module scope, not the user
    // instance. It also compares against the literal 'email' rather than
    // EMAIL_PROVIDER.Email ('Email'), so even a working `this` wouldn't
    // match. In practice this validator does not conditionally require
    // email based on provider the way it appears to.
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
  // How the account was created. Only EMAIL_PROVIDER.Email is possible today
  // — this used to also distinguish Google/Facebook OAuth signups before
  // that feature was removed.
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
  // Set by the "forgot password" flow (routes/api/auth.js); cleared once
  // the token is used or a new one is issued.
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('User', UserSchema);
