// Shared enums used across models/routes/middleware, so route handlers and
// schemas compare against these instead of raw string literals.

// A user's permission level; checked by middleware/role.js.
exports.ROLES = {
  Admin: 'ROLE ADMIN',
  Member: 'ROLE MEMBER',
  Merchant: 'ROLE MERCHANT'
};

// Lifecycle status of a merchant application (routes/api/merchant.js).
exports.MERCHANT_STATUS = {
  Rejected: 'Rejected',
  Approved: 'Approved',
  Waiting_Approval: 'Waiting Approval'
};

// Fulfillment status of items within a placed order (routes/api/order.js).
exports.CART_ITEM_STATUS = {
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Not_processed: 'Not processed'
};

// Moderation status of a submitted product review (routes/api/review.js).
exports.REVIEW_STATUS = {
  Rejected: 'Rejected',
  Approved: 'Approved',
  Waiting_Approval: 'Waiting Approval'
};

// How a user account was created. Only 'Email' exists today — this used to
// also include Google/Facebook OAuth providers before that feature was removed.
exports.EMAIL_PROVIDER = {
  Email: 'Email'
};

// Unused today, kept in case cookie-based (rather than header-based) JWT
// transport is added later.
exports.JWT_COOKIE = 'x-jwt-cookie';
