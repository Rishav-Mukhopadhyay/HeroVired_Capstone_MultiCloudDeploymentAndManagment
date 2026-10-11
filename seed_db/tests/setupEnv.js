const fs = require('fs');
const path = require('path');

// Runs (via jest.config.js's `setupFiles`) before the test file's module
// registry is set up, so this is in place before utils/db.js (which reads
// process.env.MONGO_URI) is ever required. dotenv().config() never
// overwrites a variable that's already set, so a developer's own
// seed_db/.env is never consulted here.
const configPath = path.join(__dirname, 'globalConfig.json');
if (fs.existsSync(configPath)) {
  const { mongoUri } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  process.env.MONGO_URI = mongoUri;
}
