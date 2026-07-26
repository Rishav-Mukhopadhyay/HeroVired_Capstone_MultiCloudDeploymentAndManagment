const request = require('supertest');

const dbHandler = require('../../tests/dbHandler');
const buildApp = require('../../tests/buildApp');
const { createAuthedUser, invalidId, newId, waitFor } = require('../../tests/helpers');
const { ROLES, CART_ITEM_STATUS } = require('../../constants');
const orderRouter = require('./order');
const Order = require('../../models/order');
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const mail = require('../../services/mail');

const app = buildApp(orderRouter);

beforeAll(async () => {
  await dbHandler.connect();
});

afterEach(async () => {
  await dbHandler.clear();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await dbHandler.disconnect();
});

describe('POST /add', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/add').send({});
    expect(res.status).toBe(401);
  });

  it('creates an order and sends a (mocked) confirmation email', async () => {
    const { user, token } = await createAuthedUser();
    const product = await new Product({ sku: 'SKU-O1', name: 'Ordered Thing', price: 10 }).save();
    const cart = await new Cart({
      user: user._id,
      products: [{ product: product._id, quantity: 1, totalPrice: 10, status: 'Not processed' }]
    }).save();
    const sendMailSpy = jest.spyOn(mail, 'sendMail').mockResolvedValue({ mocked: true });

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({ cartId: cart._id, total: 10 });

    expect(res.status).toBe(200);
    expect(res.body.order._id).toBeDefined();

    await waitFor(() => sendMailSpy.mock.calls.length > 0);
    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email })
    );
  });

  it('does not send an email when the freshly-placed order cannot be re-fetched', async () => {
    const { user, token } = await createAuthedUser();
    const cart = await new Cart({ user: user._id, products: [] }).save();
    const sendMailSpy = jest.spyOn(mail, 'sendMail').mockResolvedValue({ mocked: true });
    // Order.findOne(...) is chained with .populate(...) synchronously
    // before being awaited (a real Mongoose Query supports this) — a plain
    // mockResolvedValueOnce would return a bare Promise with no .populate
    // method, so the mock has to mimic that shape instead.
    const findOneSpy = jest
      .spyOn(Order, 'findOne')
      .mockReturnValueOnce({ populate: () => Promise.resolve(null) });

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({ cartId: cart._id, total: 0 });

    expect(res.status).toBe(200);
    await waitFor(() => findOneSpy.mock.calls.length > 0);
    // Give the (now-resolved) findOne's continuation a moment to run its
    // `if (!orderDoc) return;` branch before asserting the negative.
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(sendMailSpy).not.toHaveBeenCalled();
  });

  it('still responds successfully even if sending the confirmation email fails', async () => {
    const { user, token } = await createAuthedUser();
    const cart = await new Cart({ user: user._id, products: [] }).save();
    const sendMailSpy = jest
      .spyOn(mail, 'sendMail')
      .mockRejectedValueOnce(new Error('mail boom'));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({ cartId: cart._id, total: 0 });

    expect(res.status).toBe(200);
    await waitFor(() => sendMailSpy.mock.calls.length > 0);
    await waitFor(() => logSpy.mock.calls.length > 0);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(Order.prototype, 'save').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({ cartId: newId(), total: 0 });

    expect(res.status).toBe(400);
  });
});

describe('GET /search', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/search').query({ search: invalidId });
    expect(res.status).toBe(401);
  });

  it('returns an empty list for a non-ObjectId search term', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .get('/search')
      .query({ search: invalidId })
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });

  it('finds an order by id for an admin', async () => {
    const { user, token } = await createAuthedUser({ role: ROLES.Admin });
    const product = await new Product({ sku: 'SKU-S1', name: 'Search Thing', price: 5 }).save();
    const cart = await new Cart({
      user: user._id,
      products: [{ product: product._id, quantity: 1, totalPrice: 5, status: 'Not processed' }]
    }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 5 }).save();

    const res = await request(app)
      .get('/search')
      .query({ search: order._id.toString() })
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });

  it("only finds the caller's own order for a non-admin", async () => {
    const { user, token } = await createAuthedUser({ role: ROLES.Member });
    const { user: otherUser } = await createAuthedUser();
    const cart = await new Cart({ user: otherUser._id, products: [] }).save();
    const order = await new Order({ cart: cart._id, user: otherUser._id, total: 0 }).save();

    const res = await request(app)
      .get('/search')
      .query({ search: order._id.toString() })
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    jest.spyOn(Order, 'find').mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .get('/search')
      .query({ search: newId().toString() })
      .set('Authorization', token);

    expect(res.status).toBe(400);
  });
});

describe('GET /', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
  });

  it('lists orders with pagination', async () => {
    const { user, token } = await createAuthedUser();
    const cart = await new Cart({ user: user._id, products: [] }).save();
    await new Order({ cart: cart._id, user: user._id, total: 0 }).save();

    const res = await request(app).get('/').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(Order, 'find').mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app).get('/').set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('GET /me', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });

  it("lists only the caller's own orders", async () => {
    const { user, token } = await createAuthedUser();
    const cart = await new Cart({ user: user._id, products: [] }).save();
    await new Order({ cart: cart._id, user: user._id, total: 0 }).save();
    const { user: otherUser } = await createAuthedUser();
    const otherCart = await new Cart({ user: otherUser._id, products: [] }).save();
    await new Order({ cart: otherCart._id, user: otherUser._id, total: 0 }).save();

    const res = await request(app).get('/me').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(Order, 'find').mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app).get('/me').set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('GET /:orderId', () => {
  it('returns the order for an admin', async () => {
    const { user, token } = await createAuthedUser({ role: ROLES.Admin });
    const cart = await new Cart({ user: user._id, products: [] }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 0 }).save();

    const res = await request(app)
      .get(`/${order._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.order._id.toString()).toBe(order._id.toString());
  });

  it("returns the caller's own order when not an admin", async () => {
    const { user, token } = await createAuthedUser({ role: ROLES.Member });
    const cart = await new Cart({ user: user._id, products: [] }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 0 }).save();

    const res = await request(app)
      .get(`/${order._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
  });

  it('returns 404 when the order or its cart cannot be found', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    const res = await request(app)
      .get(`/${newId()}`)
      .set('Authorization', token);
    expect(res.status).toBe(404);
  });

  it('returns 400 on a malformed id', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    const res = await request(app)
      .get(`/${invalidId}`)
      .set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /cancel/:orderId', () => {
  it('cancels the order, restores inventory, and deletes the cart', async () => {
    const { user, token } = await createAuthedUser();
    const product = await new Product({
      sku: 'SKU-CANCEL',
      name: 'Cancel Thing',
      quantity: 5
    }).save();
    const cart = await new Cart({
      user: user._id,
      products: [{ product: product._id, quantity: 2 }]
    }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 0 }).save();

    const res = await request(app)
      .delete(`/cancel/${order._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // increaseQuantity (utils/store.js) is fire-and-forget, not awaited by
    // the route, so poll for the real DB write instead of guessing a delay.
    await waitFor(async () => {
      const current = await Product.findById(product._id);
      return current.quantity === 7;
    });
    expect(await Order.findById(order._id)).toBeNull();
    expect(await Cart.findById(cart._id)).toBeNull();
  });

  it('returns 400 on a malformed id', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .delete(`/cancel/${invalidId}`)
      .set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('PUT /status/item/:itemId', () => {
  it('updates a single item status without cancelling the order', async () => {
    const { user, token } = await createAuthedUser();
    const product = await new Product({ sku: 'SKU-STATUS', name: 'Status Thing' }).save();
    const cart = await new Cart({
      user: user._id,
      products: [
        { product: product._id, quantity: 1, status: CART_ITEM_STATUS.Not_processed }
      ]
    }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 0 }).save();
    const itemId = cart.products[0]._id;

    const res = await request(app)
      .put(`/status/item/${itemId}`)
      .set('Authorization', token)
      .send({ orderId: order._id, cartId: cart._id, status: CART_ITEM_STATUS.Shipped });

    expect(res.status).toBe(200);
    const stored = await Cart.findById(cart._id);
    expect(stored.products[0].status).toBe(CART_ITEM_STATUS.Shipped);
  });

  it('cancelling the only item restores inventory and cancels the whole order', async () => {
    const { user, token } = await createAuthedUser();
    const product = await new Product({
      sku: 'SKU-CANCEL-ITEM',
      name: 'Cancel Item Thing',
      quantity: 3
    }).save();
    const cart = await new Cart({
      user: user._id,
      products: [
        { product: product._id, quantity: 2, status: CART_ITEM_STATUS.Not_processed }
      ]
    }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 0 }).save();
    const itemId = cart.products[0]._id;

    const res = await request(app)
      .put(`/status/item/${itemId}`)
      .set('Authorization', token)
      .send({ orderId: order._id, cartId: cart._id, status: CART_ITEM_STATUS.Cancelled });

    expect(res.status).toBe(200);
    expect(res.body.orderCancelled).toBe(true);

    const storedProduct = await Product.findById(product._id);
    expect(storedProduct.quantity).toBe(5);
    expect(await Order.findById(order._id)).toBeNull();
    expect(await Cart.findById(cart._id)).toBeNull();
  });

  it('cancelling one of several items only cancels that item', async () => {
    const { user, token } = await createAuthedUser();
    const productA = await new Product({ sku: 'SKU-MULTI-A', name: 'A', quantity: 3 }).save();
    const productB = await new Product({ sku: 'SKU-MULTI-B', name: 'B', quantity: 3 }).save();
    const cart = await new Cart({
      user: user._id,
      products: [
        { product: productA._id, quantity: 1, status: CART_ITEM_STATUS.Not_processed },
        { product: productB._id, quantity: 1, status: CART_ITEM_STATUS.Not_processed }
      ]
    }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 0 }).save();
    const itemId = cart.products[0]._id;

    const res = await request(app)
      .put(`/status/item/${itemId}`)
      .set('Authorization', token)
      .send({ orderId: order._id, cartId: cart._id, status: CART_ITEM_STATUS.Cancelled });

    expect(res.status).toBe(200);
    expect(res.body.orderCancelled).toBeUndefined();
    expect(await Order.findById(order._id)).not.toBeNull();
  });

  it('defaults to Cancelled when no status is given', async () => {
    const { user, token } = await createAuthedUser();
    const product = await new Product({ sku: 'SKU-DEFAULT', name: 'Default Thing', quantity: 1 }).save();
    const cart = await new Cart({
      user: user._id,
      products: [{ product: product._id, quantity: 1, status: CART_ITEM_STATUS.Not_processed }]
    }).save();
    const order = await new Order({ cart: cart._id, user: user._id, total: 0 }).save();
    const itemId = cart.products[0]._id;

    const res = await request(app)
      .put(`/status/item/${itemId}`)
      .set('Authorization', token)
      .send({ orderId: order._id, cartId: cart._id });

    expect(res.status).toBe(200);
    expect(res.body.orderCancelled).toBe(true);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(Cart, 'findOne').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .put(`/status/item/${newId()}`)
      .set('Authorization', token)
      .send({ orderId: newId(), cartId: newId(), status: CART_ITEM_STATUS.Shipped });

    expect(res.status).toBe(400);
  });
});
