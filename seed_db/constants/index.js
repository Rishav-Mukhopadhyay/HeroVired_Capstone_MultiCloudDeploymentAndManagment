// Duplicated from server/constants/index.js — seed_db is deployed/run
// independently of server (same as client/server are of each other), so it
// doesn't import across project boundaries. Only the enums seeding actually
// needs (ROLES, EMAIL_PROVIDER, via models/user.js) are kept here.

// A user's permission level.
exports.ROLES = {
  Admin: 'ROLE ADMIN',
  Member: 'ROLE MEMBER',
  Merchant: 'ROLE MERCHANT'
};

// How a user account was created. Only 'Email' exists today.
exports.EMAIL_PROVIDER = {
  Email: 'Email'
};
