/** Jest config for pure (framework-agnostic) tests — no React Native preset.
 *  Used by `npm run test:core`. The full `npm test` uses jest-expo for component tests. */
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(zod)/)'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/__components__/'],
  testMatch: ['<rootDir>/src/**/*.test.ts'],
};
