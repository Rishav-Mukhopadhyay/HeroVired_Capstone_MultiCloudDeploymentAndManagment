// Central place that reads identity_server/.env (via dotenv, loaded in
// index.js) and re-exports the values as a typed-ish config object, so the
// rest of this service never touches `process.env` directly.
module.exports = {
  app: {
    name: 'Identity Service',
    // Path prefix all routes are mounted under, e.g. BASE_API_URL=api -> /api/...
    apiURL: `${process.env.BASE_API_URL}`
  },
  port: process.env.PORT || 3101,
  database: {
    // MongoDB connection string, consumed by utils/db.js
    url: process.env.MONGO_URI
  },
  jwt: {
    // HMAC secret used to both sign (routes/api/auth.js) and verify
    // (config/passport.js) auth tokens. Must be identical across every
    // microservice — there is no central auth server, each service verifies
    // the same stateless JWT independently.
    secret: process.env.JWT_SECRET,
    tokenLife: '7d'
  }
};
