require('dotenv').config();
const chalk = require('chalk');
const mongoose = require('mongoose');

const keys = require('../config/keys');
const { database } = keys;

// NOTE: connection failures are only logged (`.catch(err => console.log(err))`),
// never thrown/rejected — this function always resolves, so callers (see
// server/index.js) can't detect at startup whether Mongo is actually
// reachable. The server will start and listen on its port regardless; every
// DB-backed route will simply fail until a connection succeeds.
const setupDB = async () => {
  try {
    // Connect to MongoDB
    mongoose.set('useCreateIndex', true);
    mongoose
      .connect(database.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      })
      .then(() =>
        console.log(`${chalk.green('✓')} ${chalk.blue('MongoDB Connected!')}`)
      )
      .catch(err => console.log(err));
  } catch (error) {
    return null;
  }
};

module.exports = setupDB;
