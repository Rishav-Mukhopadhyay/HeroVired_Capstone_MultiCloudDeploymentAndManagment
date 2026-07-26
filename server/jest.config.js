// Jest config for the server test suite. Tests live next to the source
// files they cover (*.test.js); shared test infrastructure (in-memory Mongo
// bootstrap, a supertest app factory, model registration) lives in tests/.
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testTimeout: 30000,
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!coverage/**',
    '!tests/**',
    '!jest.config.js',
    '!**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      lines: 100
    }
  }
};
