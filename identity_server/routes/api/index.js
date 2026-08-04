// Fans out /api/* to this service's routers: auth, user, address.
const router = require('express').Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const addressRoutes = require('./address');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/address', addressRoutes);

module.exports = router;
