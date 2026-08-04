// Route guard: verifies the request's JWT (via the strategy configured in
// config/passport.js) and populates `req.user` on success, or responds
// 401 automatically on failure. Apply as middleware on any route that
// requires a logged-in user, e.g. `router.get('/', auth, handler)`.
const passport = require('passport');

const auth = passport.authenticate('jwt', { session: false });

module.exports = auth;
