module.exports = {
  root: true,  // Ensure ESLint considers this the root configuration
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: "latest", // For target ESNext
    sourceType: "module", // Allows the use of imports
  },
  plugins: [
    '@typescript-eslint',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // ESLint rules here
    'prettier/prettier': 'error',  // Show Prettier errors as ESLint errors
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
      },
    },
  ],
};
