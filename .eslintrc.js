// Learn more https://docs.expo.io/guides/using-eslint
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*', '/web-build/*', '/node_modules/*', '/.expo/*', '/.agents_tmp/*'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'react/no-unescaped-entities': 'off',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', 'jest.setup.js', 'jest.core.config.js'],
      env: { jest: true, node: true },
    },
  ],
};
