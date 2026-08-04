// Duplicated (trimmed) from catalog_server/models/product.js, which owns
// this collection. commerce_server needs this registered for cart.js's
// bulk quantity writes and order.js's populate chain — never creates
// products. Same shared MongoDB database, not a data copy.
const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

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
  taxable: {
    type: Boolean,
    default: false
  },
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
