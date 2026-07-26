const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const dbHandler = require('../../tests/dbHandler');
const buildApp = require('../../tests/buildApp');
const { createUser, createToken, uniqueEmail } = require('../../tests/helpers');
const authRouter = require('./auth');
const User = require('../../models/user');

const app = buildApp(authRouter);

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

describe('POST /login', () => {
  it('rejects a missing email', async () => {
    const res = await request(app).post('/login').send({ password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects a missing password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'a@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects an email with no matching user', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'nobody@test.com', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no user found/i);
  });

  it('rejects a non-Email provider account', async () => {
    const email = uniqueEmail();
    await createUser({ email, provider: 'Google', password: 'password123' });

    const res = await request(app)
      .post('/login')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already in use using/i);
  });

  it('rejects an incorrect password', async () => {
    const email = uniqueEmail();
    await createUser({ email, password: 'correct-password' });

    const res = await request(app)
      .post('/login')
      .send({ email, password: 'wrong-password' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/incorrect/i);
  });

  it('logs in successfully and returns a bearer token', async () => {
    const email = uniqueEmail();
    await createUser({ email, password: 'correct-password' });

    const res = await request(app)
      .post('/login')
      .send({ email, password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toMatch(/^Bearer /);
    expect(res.body.user.email).toBe(email);
  });

  it('returns 400 if token signing unexpectedly fails', async () => {
    const email = uniqueEmail();
    await createUser({ email, password: 'correct-password' });
    jest.spyOn(jwt, 'sign').mockReturnValueOnce(null);

    const res = await request(app)
      .post('/login')
      .send({ email, password: 'correct-password' });

    expect(res.status).toBe(400);
  });

  it('returns 400 on an unexpected error', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/login')
      .send({ email: 'a@test.com', password: 'x' });

    expect(res.status).toBe(400);
  });
});

describe('POST /register', () => {
  it('rejects a missing email', async () => {
    const res = await request(app)
      .post('/register')
      .send({ firstName: 'A', lastName: 'B', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects a missing name', async () => {
    const res = await request(app)
      .post('/register')
      .send({ email: uniqueEmail(), password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/full name/i);
  });

  it('rejects a missing password', async () => {
    const res = await request(app)
      .post('/register')
      .send({ email: uniqueEmail(), firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects an email already in use', async () => {
    const email = uniqueEmail();
    await createUser({ email });

    const res = await request(app)
      .post('/register')
      .send({ email, firstName: 'A', lastName: 'B', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already in use/i);
  });

  it('registers a new user and returns a bearer token', async () => {
    const email = uniqueEmail();

    const res = await request(app).post('/register').send({
      email,
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'password123'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toMatch(/^Bearer /);

    const stored = await User.findOne({ email });
    expect(stored).not.toBeNull();
    expect(stored.password).not.toBe('password123');
  });

  it('returns 400 on an unexpected error', async () => {
    jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app).post('/register').send({
      email: uniqueEmail(),
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'password123'
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /forgot', () => {
  it('rejects a missing email', async () => {
    const res = await request(app).post('/forgot').send({});
    expect(res.status).toBe(400);
  });

  it('rejects an email with no matching user', async () => {
    const res = await request(app)
      .post('/forgot')
      .send({ email: 'nobody@test.com' });
    expect(res.status).toBe(400);
  });

  it('issues a reset token for an existing user', async () => {
    const email = uniqueEmail();
    await createUser({ email });

    const res = await request(app).post('/forgot').send({ email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const stored = await User.findOne({ email });
    expect(stored.resetPasswordToken).toBeTruthy();
    expect(stored.resetPasswordExpires).toBeTruthy();
  });

  it('returns 400 on an unexpected error', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
      .post('/forgot')
      .send({ email: 'a@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /reset/:token', () => {
  it('rejects a missing password', async () => {
    const res = await request(app).post('/reset/sometoken').send({});
    expect(res.status).toBe(400);
  });

  it('rejects an invalid/expired token', async () => {
    const res = await request(app)
      .post('/reset/does-not-exist')
      .send({ password: 'newpassword' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('resets the password for a valid token', async () => {
    const user = await createUser({});
    user.resetPasswordToken = 'valid-token';
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const res = await request(app)
      .post('/reset/valid-token')
      .send({ password: 'brand-new-password' });

    expect(res.status).toBe(200);

    const stored = await User.findById(user._id);
    expect(stored.resetPasswordToken).toBeUndefined();
    const matches = await bcrypt.compare('brand-new-password', stored.password);
    expect(matches).toBe(true);
  });

  it('returns 400 on an unexpected error', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
      .post('/reset/whatever')
      .send({ password: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('POST /reset (authenticated change-password)', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/reset').send({ password: 'x' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when the authenticated user has no email', async () => {
    const user = await createUser({});
    // The email schema-level `required` validator is broken (see
    // models/user.js) and never actually enforces anything, so this save
    // succeeds despite unsetting email.
    user.email = undefined;
    await user.save({ validateBeforeSave: false });
    const token = createToken(user);

    const res = await request(app)
      .post('/reset')
      .set('Authorization', token)
      .send({ password: 'current', confirmPassword: 'new' });

    expect(res.status).toBe(401);
  });

  it('rejects a missing password', async () => {
    const { token } = await require('../../tests/helpers').createAuthedUser();
    const res = await request(app)
      .post('/reset')
      .set('Authorization', token)
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects when no user is found for the authenticated email', async () => {
    const { user, token } = await require('../../tests/helpers').createAuthedUser();
    // Model.findById() is itself implemented via findOne() under the hood,
    // so the first findOne call here is actually passport's own lookup
    // (must still resolve the real user for auth to succeed) — only the
    // second call is this route's own explicit User.findOne({ email }).
    jest
      .spyOn(User, 'findOne')
      .mockImplementationOnce(() => Promise.resolve(user))
      .mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/reset')
      .set('Authorization', token)
      .send({ password: 'x', confirmPassword: 'y' });

    expect(res.status).toBe(400);
  });

  it('rejects an incorrect current password', async () => {
    const { token } = await require('../../tests/helpers').createAuthedUser({
      password: 'correct-password'
    });

    const res = await request(app)
      .post('/reset')
      .set('Authorization', token)
      .send({ password: 'wrong-password', confirmPassword: 'new-password' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/correct old password/i);
  });

  it('returns 400 on an unexpected error', async () => {
    const { token } = await require('../../tests/helpers').createAuthedUser({
      password: 'correct-password'
    });
    jest.spyOn(bcrypt, 'compare').mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/reset')
      .set('Authorization', token)
      .send({ password: 'correct-password', confirmPassword: 'new-password' });

    expect(res.status).toBe(400);
  });

  it('changes the password successfully', async () => {
    const { user, token } = await require('../../tests/helpers').createAuthedUser({
      password: 'correct-password'
    });

    const res = await request(app)
      .post('/reset')
      .set('Authorization', token)
      .send({ password: 'correct-password', confirmPassword: 'new-password' });

    expect(res.status).toBe(200);

    const stored = await User.findById(user._id);
    const matches = await bcrypt.compare('new-password', stored.password);
    expect(matches).toBe(true);
  });
});
