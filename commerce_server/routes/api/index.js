const router = require('express').Router();

const cartRoutes = require('./cart');
const orderRoutes = require('./order');
const merchantRoutes = require('./merchant');

router.use('/cart', cartRoutes);
router.use('/order', orderRoutes);
router.use('/merchant', merchantRoutes);

module.exports = router;
