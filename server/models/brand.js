const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

// Registers the slug plugin globally, so any schema with a `slug: 'name'`
// field (see below) auto-derives a URL-safe, unique slug from that field.
Mongoose.plugin(slug, options);

// A merchant's storefront brand (e.g. "Nike"), or a house brand with no
// merchant when created directly by an admin.
const BrandSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  // Dead field: nothing in the app populates or reads this. Brand images
  // were never wired up to an upload route (unlike Product, which briefly
  // had one via S3 before that feature was removed).
  image: {
    data: Buffer,
    contentType: String
  },
  description: {
    type: String,
    trim: true
  },
  // Toggled off to hide the brand (and, per business logic in the routes,
  // its products) from the storefront without deleting it.
  isActive: {
    type: Boolean,
    default: true
  },
  // null for brands an admin creates directly; set once a merchant
  // application is approved and this brand becomes theirs.
  merchant: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Brand', BrandSchema);
