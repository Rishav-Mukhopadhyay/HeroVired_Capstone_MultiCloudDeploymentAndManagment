// Authorization guard, layered on top of (and after) the `auth` middleware.
// `role.check(...roles)` is a factory, not the middleware itself — calling it
// with one or more allowed roles returns the actual Express middleware, so
// routes read as `role.check(ROLES.Admin, ROLES.Merchant)`. It assumes
// `req.user` was already set by `auth`; it doesn't authenticate on its own.
const check =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).send('Unauthorized');
    }

    const hasRole = roles.find(role => req.user.role === role);
    if (!hasRole) {
      return res.status(403).send('You are not allowed to make this request.');
    }

    return next();
  };

const role = { check };
module.exports = role;
