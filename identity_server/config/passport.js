// Configures Passport's JWT strategy — this is what actually verifies the
// `Authorization: Bearer <token>` header on every route that uses the `auth`
// middleware (middleware/auth.js). Identical strategy config to every other
// microservice in this project: same JWT_SECRET, so a token issued by
// identity_server's /api/auth/login is independently verifiable here without
// a network call back to identity_server.
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');

const keys = require('./keys');

const User = mongoose.model('User');
const secret = keys.jwt.secret;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secret;

passport.use(
  new JwtStrategy(opts, (payload, done) => {
    User.findById(payload.id)
      .then(user => {
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      })
      .catch(err => {
        return done(err, false);
      });
  })
);

module.exports = async app => {
  app.use(passport.initialize());
};
