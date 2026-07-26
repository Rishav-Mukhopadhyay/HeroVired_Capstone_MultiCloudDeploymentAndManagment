const constants = require('./index');

it('exposes every shared enum used across models/routes/middleware', () => {
  expect(constants.ROLES).toEqual({
    Admin: 'ROLE ADMIN',
    Member: 'ROLE MEMBER',
    Merchant: 'ROLE MERCHANT'
  });
  expect(constants.MERCHANT_STATUS).toEqual({
    Rejected: 'Rejected',
    Approved: 'Approved',
    Waiting_Approval: 'Waiting Approval'
  });
  expect(constants.CART_ITEM_STATUS).toEqual({
    Processing: 'Processing',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
    Not_processed: 'Not processed'
  });
  expect(constants.REVIEW_STATUS).toEqual({
    Rejected: 'Rejected',
    Approved: 'Approved',
    Waiting_Approval: 'Waiting Approval'
  });
  expect(constants.EMAIL_PROVIDER).toEqual({ Email: 'Email' });
  expect(constants.JWT_COOKIE).toBe('x-jwt-cookie');
});
