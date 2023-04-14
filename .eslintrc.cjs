module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: "latest", // For target ESNext
    sourceType: "module", // Allows the use of imports
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
