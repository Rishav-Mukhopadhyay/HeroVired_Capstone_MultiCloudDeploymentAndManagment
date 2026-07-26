// Configures Passport's JWT strategy — this is what actually verifies the
// `Authorization: Bearer <token>` header on every route that uses the `auth`
// middleware (middleware/auth.js). Google/Facebook OAuth strategies used to
// live here too; they were removed along with that feature.
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');

const keys = require('./keys');

const User = mongoose.model('User');
const secret = keys.jwt.secret;

const opts = {};
// Pull the raw token out of the Authorization header instead of a cookie/query param.
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secret;

passport.use(
  // Runs only after passport-jwt has already verified the token's signature
  // and expiry against `secret` — this callback just resolves the payload's
  // user id to an actual User document.
  new JwtStrategy(opts, (payload, done) => {
    User.findById(payload.id)
      .then(user => {
        if (user) {
          return done(null, user);
        }

        // Valid token, but the user it points to no longer exists.
        return done(null, false);
      })
      .catch(err => {
        return done(err, false);
      });
  })
);

// Wires passport into the Express app; called once from index.js.
module.exports = async app => {
  app.use(passport.initialize());
};
