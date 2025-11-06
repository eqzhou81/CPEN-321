const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/mock'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: [path.resolve(__dirname, 'tests/setup.mock.ts')],
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
  coverageDirectory: 'coverage/mocked',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
};