const request = require('supertest');

const dbHandler = require('../../tests/dbHandler');
const buildApp = require('../../tests/buildApp');
const { createAuthedUser, invalidId } = require('../../tests/helpers');
const addressRouter = require('./address');
const Address = require('../../models/address');

const app = buildApp(addressRouter);

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

  it('creates an address owned by the authenticated user', async () => {
    const { user, token } = await createAuthedUser();

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({ address: '123 Main St', city: 'LA', state: 'CA', country: 'US', zipCode: '90001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.address.user).toBe(user._id.toString());
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(Address.prototype, 'save').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/add')
      .set('Authorization', token)
      .send({ address: '123 Main St' });

    expect(res.status).toBe(400);
  });
});

describe('GET /', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
  });

  it('lists only the authenticated user\'s addresses', async () => {
    const { user, token } = await createAuthedUser();
    await new Address({ user: user._id, address: 'A' }).save();
    const { user: otherUser } = await createAuthedUser();
    await new Address({ user: otherUser._id, address: 'B' }).save();

    const res = await request(app).get('/').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.addresses).toHaveLength(1);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(Address, 'find').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app).get('/').set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('GET /:id', () => {
  it('returns 404 when the address does not exist', async () => {
    const { newId } = require('../../tests/helpers');
    const res = await request(app).get(`/${newId()}`);
    expect(res.status).toBe(404);
  });

  it('returns the address', async () => {
    const { user } = await createAuthedUser();
    const address = await new Address({ user: user._id, address: 'A' }).save();

    const res = await request(app).get(`/${address._id}`);

    expect(res.status).toBe(200);
    expect(res.body.address._id).toBe(address._id.toString());
  });

  it('returns 400 on a malformed id', async () => {
    const res = await request(app).get(`/${invalidId}`);
    expect(res.status).toBe(400);
  });
});

describe('PUT /:id', () => {
  it('updates the address', async () => {
    const { user } = await createAuthedUser();
    const address = await new Address({ user: user._id, city: 'Old' }).save();

    const res = await request(app).put(`/${address._id}`).send({ city: 'New' });

    expect(res.status).toBe(200);
    const stored = await Address.findById(address._id);
    expect(stored.city).toBe('New');
  });

  it('returns 400 on a malformed id', async () => {
    const res = await request(app).put(`/${invalidId}`).send({ city: 'New' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /delete/:id', () => {
  it('deletes the address', async () => {
    const { user } = await createAuthedUser();
    const address = await new Address({ user: user._id }).save();

    const res = await request(app).delete(`/delete/${address._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const stored = await Address.findById(address._id);
    expect(stored).toBeNull();
  });

  it('returns 400 on an unexpected error', async () => {
    jest.spyOn(Address, 'deleteOne').mockRejectedValueOnce(new Error('boom'));
    const { newId } = require('../../tests/helpers');
    const res = await request(app).delete(`/delete/${newId()}`);
    expect(res.status).toBe(400);
  });
});
