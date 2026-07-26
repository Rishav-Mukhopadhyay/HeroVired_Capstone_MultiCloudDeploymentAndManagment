const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// One row per (user, product) pair. `isLiked` is the actual "is this
// currently on the wishlist" flag — rows aren't deleted when a user removes
// an item, just toggled off, so the association is kept around.
const WishlistSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isLiked: {
    type: Boolean,
    default: false
  },
  // Unlike other models' `updated` field, this one defaults to now instead
  // of being left unset until first modified — an inconsistency, not a
  // deliberate design difference.
  updated: {
    type: Date,
    default: Date.now
  },
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Wishlist', WishlistSchema);
