module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  parserOptions: {
    ecmaVersion: "latest", // For target ESNext
    sourceType: "module", // Allows for the use of imports
  },
  env: {
    node: true,
    mocha: true,
    es6: true,
  },
  rules: {
    "max-len": ["error", 1000],
  },
};
