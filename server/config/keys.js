// Central place that reads server/.env (via dotenv, loaded in index.js) and
// re-exports the values as a typed-ish config object, so the rest of the
// server never touches `process.env` directly.
module.exports = {
  app: {
    name: 'Mern Ecommerce',
    // Path prefix all API routes are mounted under, e.g. BASE_API_URL=api -> /api/...
    apiURL: `${process.env.BASE_API_URL}`
  },
  port: process.env.PORT || 3000,
  database: {
    // MongoDB connection string, consumed by utils/db.js
    url: process.env.MONGO_URI
  },
  jwt: {
    // HMAC secret used to both sign (routes/api/auth.js) and verify
    // (config/passport.js) auth tokens.
    secret: process.env.JWT_SECRET,
    // How long an issued token stays valid before the user must log in again.
    tokenLife: '7d'
  },
  mail: {
    // Display "from" address for outbound emails (see services/mail.js).
    // No real provider is configured — sendMail() only ever mocks delivery
    // by logging, regardless of this value.
    from: process.env.MAIL_FROM || 'no-reply@mern-ecommerce.local'
  }
};
