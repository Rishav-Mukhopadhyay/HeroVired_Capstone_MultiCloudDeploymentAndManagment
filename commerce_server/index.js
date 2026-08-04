// Commerce microservice entry point: cart, order, merchant. Standalone —
// shares the MongoDB database and JWT_SECRET with the other microservices,
// and calls notification_server over HTTP for order-confirmation emails
// (config/keys.js's notificationURL, from NOTIFICATION_URL).
require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const helmet = require('helmet');

const keys = require('./config/keys');
const setupDB = require('./utils/db');

const { port } = keys;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
);
app.use(cors());

setupDB();

require('./models/user');
require('./models/product');
require('./models/brand');
require('./models/cart');
require('./models/order');
require('./models/merchant');

require('./config/passport')(app);

const routes = require('./routes');
app.use(routes);

app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `commerce_server listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});
