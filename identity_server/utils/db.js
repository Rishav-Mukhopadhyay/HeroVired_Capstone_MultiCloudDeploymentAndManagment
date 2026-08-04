require('dotenv').config();
const chalk = require('chalk');
const mongoose = require('mongoose');

const keys = require('../config/keys');
const { database } = keys;

// NOTE: connection failures are only logged, never thrown/rejected — this
// function always resolves, so index.js can't detect at startup whether
// Mongo is actually reachable. The service will start and listen on its
// port regardless; every DB-backed route will simply fail until a
// connection succeeds. Same behavior as every other service in this project.
const setupDB = async () => {
  try {
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
