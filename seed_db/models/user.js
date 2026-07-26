// Duplicated from server/models/user.js — seed_db is deployed/run
// independently of server, so it keeps its own copy of the schemas it needs
// rather than importing across project boundaries. Trimmed to the fields
// this project's seeding actually sets/reads; kept otherwise identical
// (including the documented quirk below) so a seeded document looks exactly
// like one the real server would produce.
const Mongoose = require('mongoose');

const { ROLES, EMAIL_PROVIDER } = require('../constants');

const { Schema } = Mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    // NOTE: likely doesn't behave as intended — see server/models/user.js
    // for the full explanation. Kept as-is so this copy matches the real
    // schema's actual (buggy) behavior rather than a "fixed" version.
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
