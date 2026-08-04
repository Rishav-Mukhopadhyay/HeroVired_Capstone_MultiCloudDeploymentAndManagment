// Identity microservice entry point: auth, user, address. Standalone —
// deployed/run independently of the other microservices and the gateway,
// sharing only the MongoDB database and JWT_SECRET.
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

// Registers every model this service touches (owned + populate-only) before
// anything else runs — mirrors server/tests/registerModels.js's rationale:
// avoids Mongoose's MissingSchemaError for populate() targets that aren't
// required directly by the route that uses them.
require('./models/user');
require('./models/address');
require('./models/merchant');
require('./models/brand');

// Passport must be initialized before `routes`, since protected routes use
// its `auth` middleware to verify requests.
require('./config/passport')(app);

const routes = require('./routes');
app.use(routes);

app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `identity_server listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});
