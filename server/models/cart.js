const Mongoose = require('mongoose');

const { CART_ITEM_STATUS } = require('../constants');

const { Schema } = Mongoose;

// A single line item within a Cart: a product snapshot (price/tax captured
// at add-to-cart time, not looked up live) plus its own fulfillment status —
// each item in an order can ship/get cancelled independently of the others.
const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  quantity: Number,
  purchasePrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  priceWithTax: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: CART_ITEM_STATUS.Not_processed,
    enum: [
      CART_ITEM_STATUS.Not_processed,
      CART_ITEM_STATUS.Processing,
      CART_ITEM_STATUS.Shipped,
      CART_ITEM_STATUS.Delivered,
      CART_ITEM_STATUS.Cancelled
    ]
  }
});

// CartItem is also registered as its own top-level model (not just an
// embedded subdocument), which is what lets routes/api/order.js query/update
// individual line items directly via `Cart.updateOne({'products._id': ...})`.
module.exports = Mongoose.model('CartItem', CartItemSchema);

// A user's cart: either an in-progress shopping cart, or (once an Order
// references it) the frozen line-item record for a placed order — this app
// doesn't copy cart items into a separate order-line-items collection.
const CartSchema = new Schema({
  products: [CartItemSchema],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Cart', CartSchema);
