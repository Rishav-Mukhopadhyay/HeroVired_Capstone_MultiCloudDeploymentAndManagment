const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// A placed order. Deliberately thin: the actual line items, quantities, and
// per-item fulfillment status all live on the referenced Cart document —
// Order itself just marks that a cart was checked out, by whom, and for
// how much.
const OrderSchema = new Schema({
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  total: {
    type: Number,
    default: 0
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Order', OrderSchema);
