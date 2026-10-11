const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'globalConfig.json');

// Runs once for the whole test run, in a process shared with
// globalTeardown.js (but NOT shared with index.test.js itself, which runs
// in its own worker) — so the started instance is stashed on `global` for
// teardown to stop, and its connection string is written to a file so
// setupEnv.js can read it back synchronously.
module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;

  fs.writeFileSync(configPath, JSON.stringify({ mongoUri: mongod.getUri() }));
};
