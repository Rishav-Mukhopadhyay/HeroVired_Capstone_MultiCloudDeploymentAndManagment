const request = require('supertest');

const dbHandler = require('../../tests/dbHandler');
const buildApp = require('../../tests/buildApp');
const { createAuthedUser, invalidId, newId, waitFor } = require('../../tests/helpers');
const cartRouter = require('./cart');
const Cart = require('../../models/cart');
const Product = require('../../models/product');

const app = buildApp(cartRouter);

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
    const res = await request(app).post('/add').send({ products: [] });
    expect(res.status).toBe(401);
  });

  it('creates a cart, stamps tax, and reserves inventory', async () => {
    const { token } = await createAuthedUser();
    const product = await new Product({
      sku: 'SKU-CART',
      name: 'Cart Product',
      quantity: 10,
      price: 20
    }).save();

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({
        products: [
          { product: product._id.toString(), quantity: 2, price: 20, taxable: true }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cartId).toBeDefined();

    const stored = await Cart.findById(res.body.cartId);
    expect(stored.products[0].totalPrice).toBe(40);

    // decreaseQuantity (utils/store.js) is fire-and-forget, not awaited by
    // the route, so poll for the real DB write instead of guessing a delay.
    await waitFor(async () => {
      const current = await Product.findById(product._id);
      return current.quantity === 8;
    });
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(Cart.prototype, 'save').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({ products: [] });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /delete/:cartId', () => {
  it('requires authentication', async () => {
    const res = await request(app).delete(`/delete/${newId()}`);
    expect(res.status).toBe(401);
  });

  it('deletes the cart', async () => {
    const { token } = await createAuthedUser();
    const cart = await new Cart({ products: [] }).save();

    const res = await request(app)
      .delete(`/delete/${cart._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
    const stored = await Cart.findById(cart._id);
    expect(stored).toBeNull();
  });

  it('returns 400 on a malformed id', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .delete(`/delete/${invalidId}`)
      .set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('POST /add/:cartId', () => {
  it('pushes a new line item onto an existing cart', async () => {
    const { token } = await createAuthedUser();
    const cart = await new Cart({ products: [] }).save();
    const product = await new Product({ sku: 'SKU-ADD', name: 'Add Product' }).save();

    const res = await request(app)
      .post(`/add/${cart._id}`)
      .set('Authorization', token)
      .send({ product: { product: product._id.toString(), quantity: 1 } });

    expect(res.status).toBe(200);
    const stored = await Cart.findById(cart._id);
    expect(stored.products).toHaveLength(1);
  });

  it('returns 400 on a malformed cart id', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .post(`/add/${invalidId}`)
      .set('Authorization', token)
      .send({ product: { product: newId().toString(), quantity: 1 } });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /delete/:cartId/:productId', () => {
  it('pulls a line item out of the cart', async () => {
    const { token } = await createAuthedUser();
    const product = await new Product({ sku: 'SKU-PULL', name: 'Pull Product' }).save();
    const cart = await new Cart({
      products: [{ product: product._id, quantity: 1 }]
    }).save();

    const res = await request(app)
      .delete(`/delete/${cart._id}/${product._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
    const stored = await Cart.findById(cart._id);
    expect(stored.products).toHaveLength(0);
  });

  it('returns 400 on a malformed cart id', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .delete(`/delete/${invalidId}/${newId()}`)
      .set('Authorization', token);
    expect(res.status).toBe(400);
  });
});
