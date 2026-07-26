// Single home for "how does a product get its image" server-side logic.
// Today a product's imageUrl is just a link the seller pastes in, so the
// only job here is validating that link. If uploads-to-cloud-storage are
// added later (e.g. an S3/Cloudinary integration), that upload handling
// (generating a signed URL, validating the uploaded file, then producing the
// final public URL to save on Product.imageUrl) belongs in this file too —
// routes/api/product.js only needs to keep calling into here, not change how
// it stores the result on the Product document.
const isValidImageUrl = imageUrl => /^https?:\/\/.+/i.test(imageUrl);

module.exports = { isValidImageUrl };
