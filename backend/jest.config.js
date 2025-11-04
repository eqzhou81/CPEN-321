const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: [
    // Automatically use real DB setup for "unmock" folder
    process.env.TEST_ENV === 'unmocked'
      ? path.resolve(__dirname, 'tests/setup.unmocked.ts')
      : path.resolve(__dirname, 'tests/setup.mock.ts'),
  ],
  globalTeardown: '<rootDir>/tests/teardown.ts',
  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
};
