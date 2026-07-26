require('dotenv').config();
const chalk = require('chalk');
const mongoose = require('mongoose');

// NOTE: connection failures are only logged (`.catch(err => console.log(err))`),
// never thrown/rejected — this function always resolves, so `index.js`
// can't detect at this point whether Mongo is actually reachable. Mongoose's
// own query buffering is what lets the seeding that follows work anyway, as
// long as the connection succeeds before those queries time out.
const setupDB = async () => {
  try {
    mongoose.set('useCreateIndex', true);
    mongoose
      .connect(process.env.MONGO_URI, {
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
