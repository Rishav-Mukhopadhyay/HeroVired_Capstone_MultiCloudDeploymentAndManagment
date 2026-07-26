const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

// A sellable product, owned by a Brand. Admins manage all products;
// merchants only manage the ones under their own brand (enforced in
// routes/api/product.js, not at the schema level).
const ProductSchema = new Schema({
  sku: {
    type: String
  },
  name: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  // Publicly-accessible image link supplied by the seller/merchant (no file
  // upload/storage — see routes/api/product.js#add and #:id for where this
  // is set). The client falls back to a local placeholder image whenever
  // this is empty or fails to load (see ProductImage component).
  imageUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number
  },
  price: {
    type: Number
  },
  // Whether sales tax (server/config/tax.js) applies to this product.
  taxable: {
    type: Boolean,
    default: false
  },
  // Toggled off to hide the product from the storefront without deleting it.
  isActive: {
    type: Boolean,
    default: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Product', ProductSchema);
