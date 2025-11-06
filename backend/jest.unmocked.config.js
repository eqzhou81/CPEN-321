const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unmock'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: [path.resolve(__dirname, 'tests/setup.unmocked.ts')],
  globalTeardown: '<rootDir>/tests/teardown.ts',
  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  clearMocks: true,
  fakeTimers: {
    enableGlobally: false
  },
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  modulePathIgnorePatterns: [],
  unmockedModulePathPatterns: ['mongoose'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage/unmocked',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
};