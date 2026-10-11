const crypto = require('crypto');

const { waitFor } = require('./tests/helpers');
const { ROLES } = require('./constants');

// index.js is a CLI script (`npm start <email> <password>`), never imported
// by anything else, whose top-level `email`/`password` consts are read from
// process.argv once at require time — so exercising different argv
// scenarios means re-requiring it fresh each time via jest.resetModules().
// Its own setupDB() calls mongoose.connect() but never awaits its own
// result (fire-and-forget), relying on Mongoose's write-buffering to paper
// over the gap — which works (as most tests below show) as long as it's the
// *only* connect() call in play. Pre-connecting ourselves first (e.g. to
// insert fixtures) and then letting index.js's own setupDB() connect
// *again* on top of that reliably wedges the connection into a state where
// every subsequent query just buffers until timing out — so whenever
// fixtures need inserting first, that connection is fully closed again
// before index.js ever runs, leaving its own single connect() as the only
// one.
const baseUri = process.env.MONGO_URI.endsWith('/')
  ? process.env.MONGO_URI
  : `${process.env.MONGO_URI}/`;

let consoleLogSpy;
let consoleErrorSpy;

beforeEach(() => {
  jest.resetModules();
  // Own database per test, on the shared mongod instance, so no scenario
  // can see another's leftover admin/categories/brands/products.
  process.env.MONGO_URI = `${baseUri}test_seed_${crypto
    .randomUUID()
    .replace(/-/g, '')}`;

  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  // Disconnects whatever index.js's own setupDB() connected — a no-op if
  // it's already been closed (e.g. the fixture-connection tests below close
  // it themselves before running index.js).
  await require('mongoose').disconnect();
  jest.restoreAllMocks();
});

const runSeedInProcess = async (...argv) => {
  process.argv = ['node', 'index.js', ...argv];
  require('./index');
  await waitFor(
    () =>
      consoleLogSpy.mock.calls.some(
        call => typeof call[0] === 'string' && call[0].includes('Database connection closed')
      ),
    { timeout: 25000 }
  );
};

it('logs an error and exits gracefully when required arguments are missing', async () => {
  await runSeedInProcess();

  const loggedError = consoleLogSpy.mock.calls.some(
    call => typeof call[0] === 'string' && call[0].includes('Error while seeding database')
  );
  expect(loggedError).toBe(true);
}, 25000);

it('seeds an admin user, categories, brands, and products from an empty database', async () => {
  await runSeedInProcess('fresh-admin@test.com', 'password123');

  const User = require('./models/user');
  const Category = require('./models/category');
  const Brand = require('./models/brand');
  const Product = require('./models/product');

  // index.js's own finally block always closes its connection once it's
  // done (correct — it's a one-shot CLI script) — reopen one to inspect the
  // result, since the query below would otherwise buffer forever waiting on
  // a connection that's deliberately not coming back.
  await require('mongoose').connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });

  const admin = await User.findOne({ email: 'fresh-admin@test.com' });
  expect(admin).not.toBeNull();
  expect(admin.role).toBe(ROLES.Admin);

  expect(await Category.countDocuments()).toBe(10);
  expect(await Brand.countDocuments()).toBe(10);
  expect(await Product.countDocuments()).toBe(100);

  const products = await Product.find();
  expect(products.every(product => /^https?:\/\/.+/i.test(product.imageUrl))).toBe(true);

  const categoriesWithProducts = await Category.find({
    products: { $exists: true, $not: { $size: 0 } }
  });
  expect(categoriesWithProducts.length).toBeGreaterThan(0);
}, 30000);

it('skips seeding everything on a database that already has enough of each', async () => {
  const mongoose = require('mongoose');
  const User = require('./models/user');
  const Category = require('./models/category');
  const Brand = require('./models/brand');
  const Product = require('./models/product');
  const bcrypt = require('bcryptjs');

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });

  // Fixtures are inserted directly (bypassing index.js) — this test only
  // cares about the "already sufficient, skip" branches, not re-verifying
  // creation (already covered by the previous test). insertMany bypasses
  // each document's own pre('save') middleware, so the mongoose-slug-
  // generator plugin never runs on these — an explicit, unique `slug` is
  // given directly to avoid every doc colliding on `slug: null`.
  const hash = await bcrypt.hash('password123', 1);
  await new User({
    email: 'already-seeded-admin@test.com',
    firstName: 'admin',
    lastName: 'admin',
    role: ROLES.Admin,
    password: hash
  }).save();
  await Category.insertMany(
    Array.from({ length: 10 }, (_, i) => ({
      name: `Category ${i}`,
      slug: `fixture-category-${i}`,
      isActive: true
    }))
  );
  await Brand.insertMany(
    Array.from({ length: 10 }, (_, i) => ({
      name: `Brand ${i}`,
      slug: `fixture-brand-${i}`,
      isActive: true
    }))
  );
  await Product.insertMany(
    Array.from({ length: 100 }, (_, i) => ({
      sku: `FIXTURE-SKU-${i}`,
      name: `Fixture Product ${i}`,
      slug: `fixture-product-${i}`,
      quantity: 1,
      price: 1
    }))
  );

  // Close this fixture-setup connection before index.js opens its own —
  // see the file-level comment on why the two can't coexist.
  await mongoose.disconnect();

  await runSeedInProcess('already-seeded-admin@test.com', 'password123');

  const loggedMessages = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
  expect(loggedMessages).toMatch(/admin user already exists, skipping seeding for admin user/i);
  expect(loggedMessages).toMatch(/categories already exist, skipping seeding for categories/i);
  expect(loggedMessages).toMatch(/brands already exist, skipping seeding for brands/i);
  expect(loggedMessages).toMatch(/products already exist, skipping seeding for products/i);

  // Re-open a connection to inspect the result — see the comment in the
  // "empty database" test above on why index.js's own is already closed.
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });

  expect(await User.countDocuments({ email: 'already-seeded-admin@test.com' })).toBe(1);
  expect(await Category.countDocuments()).toBe(10);
  expect(await Brand.countDocuments()).toBe(10);
  expect(await Product.countDocuments()).toBe(100);
}, 25000);

it('logs a seeding error and still closes the connection when a query fails', async () => {
  const Category = require('./models/category');
  jest.spyOn(Category, 'countDocuments').mockRejectedValueOnce(new Error('query failed'));

  await runSeedInProcess('query-fail-admin@test.com', 'password123');

  const loggedError = consoleLogSpy.mock.calls.some(
    call => typeof call[0] === 'string' && call[0].includes('Error while seeding database')
  );
  expect(loggedError).toBe(true);
}, 25000);

it('logs an initialization error when closing the connection itself fails', async () => {
  const mongoose = require('mongoose');
  jest.spyOn(mongoose.connection, 'close').mockRejectedValueOnce(new Error('close failed'));

  process.argv = ['node', 'index.js', 'close-fail-admin@test.com', 'password123'];
  require('./index');

  await waitFor(() => consoleErrorSpy.mock.calls.length > 0, { timeout: 25000 });

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining('Error initializing database')
  );
}, 25000);
