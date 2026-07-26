// Builds reusable Mongo aggregate pipelines for the storefront's product
// listing (routes/api/product.js GET /list), which needs to filter/sort by
// fields (brand.isActive, averageRating) that don't exist directly on the
// Product document and have to be computed via $lookup first.
const Mongoose = require('mongoose');

exports.getStoreProductsQuery = (min, max, rating) => {
  rating = Number(rating);
  max = Number(max);
  min = Number(min);

  const priceFilter = min && max ? { price: { $gte: min, $lte: max } } : {};
  // Both branches of this ternary produce the same object — this doesn't
  // actually behave as a conditional; `ratingFilter.rating` always ends up
  // `{ $gte: rating }`, including when rating is 0/NaN (which matches
  // "at least 0", i.e. everything).
  const ratingFilter = rating
    ? { rating: { $gte: rating } }
    : { rating: { $gte: rating } };

  const matchQuery = {
    isActive: true,
    price: priceFilter.price,
    averageRating: ratingFilter.rating
  };

  const basicQuery = [
    // Join in the product's brand so we can filter out products whose
    // brand has been deactivated (Product itself has no brand.isActive).
    {
      $lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brands'
      }
    },
    {
      $unwind: {
        path: '$brands',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        'brand.name': '$brands.name',
        'brand._id': '$brands._id',
        'brand.isActive': '$brands.isActive'
      }
    },
    {
      $match: {
        'brand.isActive': true
      }
    },
    // Join in this product's reviews just to compute an average rating
    // on the fly — there's no stored/cached rating on the Product itself.
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'product',
        as: 'reviews'
      }
    },
    {
      $addFields: {
        totalRatings: { $sum: '$reviews.rating' },
        totalReviews: { $size: '$reviews' }
      }
    },
    {
      $addFields: {
        averageRating: {
          // Avoid dividing by zero for products with no reviews yet.
          $cond: [
            { $eq: ['$totalReviews', 0] },
            0,
            { $divide: ['$totalRatings', '$totalReviews'] }
          ]
        }
      }
    },
    {
      $match: matchQuery
    },
    // Drop the joined-in arrays from the final output — callers only want
    // the product fields plus the flattened brand/averageRating additions.
    {
      $project: {
        brands: 0,
        reviews: 0
      }
    }
  ];

  return basicQuery;
};

// A $lookup + correlated subquery that finds this user's Wishlist row (if
// any) for each product and flattens its `isLiked` onto the product —
// concatenated in front of getStoreProductsQuery's pipeline by callers.
exports.getStoreProductsWishListQuery = userId => {
  const wishListQuery = [
    {
      $lookup: {
        from: 'wishlists',
        let: { product: '$_id' },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$$product', '$product'] } },
                { user: new Mongoose.Types.ObjectId(userId) }
              ]
            }
          }
        ],
        as: 'isLiked'
      }
    },
    {
      $addFields: {
        isLiked: { $arrayElemAt: ['$isLiked.isLiked', 0] }
      }
    }
  ];

  return wishListQuery;
};
