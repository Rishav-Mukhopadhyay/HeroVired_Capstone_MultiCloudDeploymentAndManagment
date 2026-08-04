// Top-level router: mounts the entire API under a configurable prefix
// (BASE_API_URL, e.g. "api" -> /api/...) and catches anything under that
// prefix that no resource router matched.
const router = require('express').Router();
const apiRoutes = require('./api');

const keys = require('../config/keys');
const { apiURL } = keys.app;

const api = `/${apiURL}`;

router.use(api, apiRoutes);
router.use(api, (req, res) => res.status(404).json('No API route found'));

module.exports = router;
