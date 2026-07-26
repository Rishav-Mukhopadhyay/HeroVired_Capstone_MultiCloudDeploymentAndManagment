const request = require('supertest');

const dbHandler = require('../../tests/dbHandler');
const buildApp = require('../../tests/buildApp');
const { createAuthedUser } = require('../../tests/helpers');
const { ROLES } = require('../../constants');
const userRouter = require('./user');
const User = require('../../models/user');

const app = buildApp(userRouter);

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

describe('GET /search', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/search').query({ search: 'a' });
    expect(res.status).toBe(401);
  });

  it('requires the Admin role', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Member });
    const res = await request(app)
      .get('/search')
      .query({ search: 'a' })
      .set('Authorization', token);
    expect(res.status).toBe(403);
  });

  it('finds matching users for an admin', async () => {
    const { token } = await createAuthedUser({
      role: ROLES.Admin,
      firstName: 'Special'
    });

    const res = await request(app)
      .get('/search')
      .query({ search: 'Special' })
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].password).toBeUndefined();
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser({ role: ROLES.Admin });
    jest.spyOn(User, 'find').mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .get('/search')
      .query({ search: 'a' })
      .set('Authorization', token);

    expect(res.status).toBe(400);
  });
});

describe('GET /', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
  });

  it('lists users with pagination for any authenticated user', async () => {
    const { token } = await createAuthedUser();

    const res = await request(app).get('/').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(User, 'find').mockImplementationOnce(() => {
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

  it("returns the caller's own profile", async () => {
    const { user, token } = await createAuthedUser();

    const res = await request(app).get('/me').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user._id.toString());
  });

  it('returns 400 on an unexpected error', async () => {
    const { user, token } = await createAuthedUser();
    // The first findById call is passport's own lookup during
    // authentication (must succeed); only the second is this route's own.
    jest
      .spyOn(User, 'findById')
      .mockImplementationOnce(() => Promise.resolve(user))
      .mockImplementationOnce(() => {
        throw new Error('boom');
      });

    const res = await request(app).get('/me').set('Authorization', token);
    expect(res.status).toBe(400);
  });
});

describe('PUT /', () => {
  it('requires authentication', async () => {
    const res = await request(app).put('/').send({ profile: {} });
    expect(res.status).toBe(401);
  });

  it("updates the caller's own profile", async () => {
    const { user, token } = await createAuthedUser();

    const res = await request(app)
      .put('/')
      .set('Authorization', token)
      .send({ profile: { firstName: 'Updated' } });

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe('Updated');

    const stored = await User.findById(user._id);
    expect(stored.firstName).toBe('Updated');
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await createAuthedUser();
    jest.spyOn(User, 'findOneAndUpdate').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .put('/')
      .set('Authorization', token)
      .send({ profile: { firstName: 'Updated' } });

    expect(res.status).toBe(400);
  });
});
