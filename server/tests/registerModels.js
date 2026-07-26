// Registers every Mongoose model on this test file's module registry.
// Several routes `.populate()` a path referencing a model that isn't
// required directly by that route file (e.g. product.js populates 'brand'
// without requiring the Brand model itself) — Mongoose throws
// MissingSchemaError if that model was never registered. Requiring
// everything up front here, before any router/test code runs, avoids
// having to work out each route's actual populate graph one at a time.
require('../models/address');
require('../models/brand');
require('../models/cart');
require('../models/category');
require('../models/contact');
require('../models/merchant');
require('../models/order');
require('../models/product');
require('../models/review');
require('../models/user');
require('../models/wishlist');
