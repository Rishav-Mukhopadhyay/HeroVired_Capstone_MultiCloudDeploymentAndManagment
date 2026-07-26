const request = require('supertest');
const bcrypt = require('bcryptjs');

const dbHandler = require('../../tests/dbHandler');
const buildApp = require('../../tests/buildApp');
const { createAuthedUser, invalidId, newId } = require('../../tests/helpers');
const { ROLES, MERCHANT_STATUS } = require('../../constants');
const merchantRouter = require('./merchant');
const Merchant = require('../../models/merchant');
const User = require('../../models/user');
const Brand = require('../../models/brand');

const app = buildApp(merchantRouter);

const validBody = () => ({
  name: 'Jane Seller',
  email: `merchant${Date.now()}${Math.random()}@test.com`,
  business: 'Selling widgets',
  phoneNumber: '555-1234',
  brandName: 'JaneCo'
});

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
  it('rejects a missing name/email', async () => {
    const res = await request(app).post('/add').send({ business: 'x', phoneNumber: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name and email/i);
  });

  it('rejects a missing business description', async () => {
    const body = validBody();
    delete body.business;
    const res = await request(app).post('/add').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/business description/i);
  });

  it('rejects a missing phone number', async () => {
    const body = validBody();
    delete body.phoneNumber;
    const res = await request(app).post('/add').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/phone number/i);
  });

  it('rejects a duplicate email', async () => {
    const body = validBody();
    await new Merchant(body).save();

    const res = await request(app).post('/add').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already in use/i);
  });

  it('creates a merchant application', async () => {
    const body = validBody();
    const res = await request(app).post('/add').send(body);

    expect(res.status).toBe(200);
    expect(res.body.merchant.status).toBe(MERCHANT_STATUS.Waiting_Approval);
  });

  it('returns 400 on an unexpected error', async () => {
    jest.spyOn(Merchant.prototype, 'save').mockRejectedValueOnce(new Error('boom'));
    const res = await request(app).post('/add').send(validBody());
    expect(res.status).toBe(400);
  });
});

describe('GET /search', () => {
  it('requires the Admin role', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Member });
    const res = await request(app)
      .get('/search')
      .query({ search: 'x' })
      .set('Authorization', token);
    expect(res.status).toBe(403);
  });

  it('finds matching merchants', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    await new Merchant({ ...validBody(), name: 'Unique Findable Name' }).save();

    const res = await request(app)
      .get('/search')
      .query({ search: 'Unique Findable' })
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.merchants).toHaveLength(1);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    jest.spyOn(Merchant, 'find').mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .get('/search')
      .query({ search: 'x' })
      .set('Authorization', token);

    expect(res.status).toBe(400);
  });
});

describe('GET /', () => {
  it('requires the Admin role', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Merchant });
    const res = await request(app).get('/').set('Authorization', token);
    expect(res.status).toBe(403);
  });

  it('lists merchants with pagination', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    await new Merchant(validBody()).save();

    const res = await request(app).get('/').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    jest.spyOn(Merchant, 'find').mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app).get('/').set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('PUT /:id/active', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .put(`/${newId()}/active`)
      .send({ merchant: { isActive: false } });
    expect(res.status).toBe(401);
  });

  it('deactivates the merchant and cascades to its brand', async () => {
    const { token } = await createAuthedUser();
    const brand = await new Brand({ name: 'CascadeBrand', isActive: true }).save();
    const merchant = await new Merchant({
      ...validBody(),
      isActive: true,
      brand: brand._id
    }).save();

    const res = await request(app)
      .put(`/${merchant._id}/active`)
      .set('Authorization', token)
      .send({ merchant: { isActive: false } });

    expect(res.status).toBe(200);
    const storedBrand = await Brand.findById(brand._id);
    expect(storedBrand.isActive).toBe(false);
  });

  it('reactivating does not cascade', async () => {
    const { token } = await createAuthedUser();
    const merchant = await new Merchant({ ...validBody(), isActive: false }).save();

    const res = await request(app)
      .put(`/${merchant._id}/active`)
      .set('Authorization', token)
      .send({ merchant: { isActive: true } });

    expect(res.status).toBe(200);
  });

  it('deactivating a merchant with no brand does not error', async () => {
    const { token } = await createAuthedUser();
    const merchant = await new Merchant({ ...validBody(), isActive: true, brand: null }).save();

    const res = await request(app)
      .put(`/${merchant._id}/active`)
      .set('Authorization', token)
      .send({ merchant: { isActive: false } });

    expect(res.status).toBe(200);
  });

  it('returns 400 on a malformed id', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .put(`/${invalidId}/active`)
      .set('Authorization', token)
      .send({ merchant: { isActive: false } });
    expect(res.status).toBe(400);
  });
});

describe('PUT /approve/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app).put(`/approve/${newId()}`);
    expect(res.status).toBe(401);
  });

  it('approves a merchant and upgrades an existing member account', async () => {
    const { token } = await createAuthedUser();
    const { user: existingMember } = await createAuthedUser({ role: ROLES.Member });
    const merchant = await new Merchant({ ...validBody(), email: existingMember.email }).save();

    const res = await request(app)
      .put(`/approve/${merchant._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);

    const storedMerchant = await Merchant.findById(merchant._id);
    expect(storedMerchant.status).toBe(MERCHANT_STATUS.Approved);

    const storedUser = await User.findById(existingMember._id);
    expect(storedUser.role).toBe(ROLES.Merchant);
    expect(storedUser.merchant.toString()).toBe(merchant._id.toString());

    const storedBrand = await Brand.findOne({ merchant: merchant._id });
    expect(storedBrand).not.toBeNull();
  });

  it('approves a merchant and provisions a brand-new user stub', async () => {
    const { token } = await createAuthedUser();
    const merchant = await new Merchant(validBody()).save();

    const res = await request(app)
      .put(`/approve/${merchant._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);

    const storedUser = await User.findOne({ email: merchant.email });
    expect(storedUser).not.toBeNull();
    expect(storedUser.role).toBe(ROLES.Merchant);
    expect(storedUser.resetPasswordToken).toBeTruthy();
    // No brand yet for the brand-new-user path — only created once they
    // complete /signup/:token.
    const storedBrand = await Brand.findOne({ merchant: merchant._id });
    expect(storedBrand).toBeNull();
  });

  it('returns 400 on a malformed id', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .put(`/approve/${invalidId}`)
      .set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('PUT /reject/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app).put(`/reject/${newId()}`);
    expect(res.status).toBe(401);
  });

  it('rejects a merchant application', async () => {
    const { token } = await createAuthedUser();
    const merchant = await new Merchant(validBody()).save();

    const res = await request(app)
      .put(`/reject/${merchant._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
    const stored = await Merchant.findById(merchant._id);
    expect(stored.status).toBe(MERCHANT_STATUS.Rejected);
  });

  it('returns 400 on a malformed id', async () => {
    const { token } = await createAuthedUser();
    const res = await request(app)
      .put(`/reject/${invalidId}`)
      .set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('POST /signup/:token', () => {
  it('rejects a missing email', async () => {
    const res = await request(app)
      .post('/signup/sometoken')
      .send({ firstName: 'A', lastName: 'B', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects a missing name', async () => {
    const res = await request(app)
      .post('/signup/sometoken')
      .send({ email: 'a@test.com', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/full name/i);
  });

  it('rejects a missing password', async () => {
    const res = await request(app)
      .post('/signup/sometoken')
      .send({ email: 'a@test.com', firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('completes signup: sets password and creates the brand', async () => {
    const merchant = await new Merchant(validBody()).save();
    const user = new User({
      email: merchant.email,
      firstName: 'Temp',
      lastName: '',
      resetPasswordToken: 'signup-token-123',
      merchant: merchant._id,
      role: ROLES.Merchant
    });
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post('/signup/signup-token-123')
      .send({
        email: merchant.email,
        firstName: 'Jane',
        lastName: 'Seller',
        password: 'new-password'
      });

    expect(res.status).toBe(200);

    const storedUser = await User.findById(user._id);
    expect(storedUser.firstName).toBe('Jane');
    const matches = await bcrypt.compare('new-password', storedUser.password);
    expect(matches).toBe(true);

    const storedBrand = await Brand.findOne({ merchant: merchant._id });
    expect(storedBrand).not.toBeNull();
    expect(storedBrand.name).toBe(merchant.brandName);
  });

  it('returns 400 on an unexpected error', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
      .post('/signup/whatever')
      .send({ email: 'a@test.com', firstName: 'A', lastName: 'B', password: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /delete/:id', () => {
  it('requires the Admin role', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Merchant });
    const res = await request(app)
      .delete(`/delete/${newId()}`)
      .set('Authorization', token);
    expect(res.status).toBe(403);
  });

  it('deletes the merchant and cascades to its brand', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    const brand = await new Brand({ name: 'ToCascade', isActive: true }).save();
    const merchant = await new Merchant({ ...validBody(), brand: brand._id }).save();

    const res = await request(app)
      .delete(`/delete/${merchant._id}`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(await Merchant.findById(merchant._id)).toBeNull();
    const storedBrand = await Brand.findById(brand._id);
    expect(storedBrand.isActive).toBe(false);
  });

  it('returns 400 on a malformed id', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    const res = await request(app)
      .delete(`/delete/${invalidId}`)
      .set('Authorization', token);
    expect(res.status).toBe(400);
  });
});
