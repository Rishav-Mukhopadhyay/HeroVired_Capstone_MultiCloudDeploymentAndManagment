// Duplicated (trimmed) from catalog_server/models/brand.js, which owns this
// collection. identity_server only needs this registered so
// routes/api/user.js's `/me` populate chain (User -> merchant -> brand)
// works — it never writes to this collection. Same shared MongoDB database,
// not a data copy.
const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

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
  image: {
    data: Buffer,
    contentType: String
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
