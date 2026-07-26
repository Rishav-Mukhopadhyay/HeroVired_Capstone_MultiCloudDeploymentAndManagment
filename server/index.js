// Server entry point: wires up the Express app, connects to MongoDB, and
// attaches Socket.IO to the same underlying HTTP server. This is the file
// `npm run dev`/`npm start` actually runs.
require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const helmet = require('helmet');

const keys = require('./config/keys');
const routes = require('./routes');
const socket = require('./socket');
const setupDB = require('./utils/db');

const { port } = keys;
const app = express();

// Parse incoming request bodies (form-encoded and JSON) before any route sees them.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  helmet({
    // CSP is disabled because this API doesn't serve HTML/scripts itself —
    // the client is a separate deployed app.
    contentSecurityPolicy: false,
    frameguard: true
  })
);
// No origin restriction: client and server are deployed separately (different
// origins), and this API accepts requests from any of them. Consider
// restricting this to the client's deployed origin in production.
app.use(cors());

setupDB();
// Passport must be initialized before `routes`, since protected routes use
// its `auth` middleware to verify requests.
require('./config/passport')(app);
app.use(routes);

const server = app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});

// Socket.IO piggybacks on the same HTTP server instance rather than listening
// on its own port.
socket(server);
