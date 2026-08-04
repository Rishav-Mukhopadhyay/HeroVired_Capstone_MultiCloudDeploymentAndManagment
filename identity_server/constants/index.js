// Shared enums used across models/routes/middleware, so route handlers and
// schemas compare against these instead of raw string literals. Kept
// identical to every other microservice's copy of this file.
exports.ROLES = {
  Admin: 'ROLE ADMIN',
  Member: 'ROLE MEMBER',
  Merchant: 'ROLE MERCHANT'
};

exports.MERCHANT_STATUS = {
  Rejected: 'Rejected',
  Approved: 'Approved',
  Waiting_Approval: 'Waiting Approval'
};

// How a user account was created. Only 'Email' exists today — this used to
// also include Google/Facebook OAuth providers before that feature was removed.
exports.EMAIL_PROVIDER = {
  Email: 'Email'
};
