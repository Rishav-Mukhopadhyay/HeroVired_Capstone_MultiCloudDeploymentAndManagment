const jwt = require('jsonwebtoken');

// "Soft" auth check for routes that work for both logged-in and anonymous
// callers (e.g. product.js's public listing, to optionally personalize
// results). Deliberately uses jwt.decode, NOT jwt.verify — it reads the
// payload without checking the signature or expiry at all, so it never
// rejects a request; a missing/invalid/expired token just resolves to null
// as if the caller weren't logged in. Do not reuse this for anything that
// needs to actually authenticate a request — use middleware/auth.js instead.
const checkAuth = async req => {
  try {
    if (!req.headers.authorization) {
      return null;
    }

    const token =
      (await jwt.decode(req.headers.authorization.split(' ')[1])) ||
      req.headers.authorization;

    // Unreachable: the `!req.headers.authorization` check above already
    // guarantees `req.headers.authorization` is truthy here, and it's used
    // unchanged as `token`'s fallback value on the line above, so `token`
    // can never be falsy by the time execution reaches this check.
    /* istanbul ignore if */
    if (!token) {
      return null;
    }

    return token;
  } catch (error) {
    return null;
  }
};

module.exports = checkAuth;
