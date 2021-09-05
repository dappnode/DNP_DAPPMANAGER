module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended" // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  // "extends": ["plugin:prettier/recommended","eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module" // Allows for the use of imports
  },
  env: {
    node: true,
    mocha: true,
    es6: true
  },
  rules: {
    "max-len": ["error", 1000],
    // ##### Some libraries do not have typings and the compiler does not understand .d.ts files
    "@typescript-eslint/no-var-requires": "off",
    // ##### typescript does not understand hoisting
    "@typescript-eslint/no-use-before-define": "off",
    // ### This project uses docker-compose which has many variables not in camelCase
    "@typescript-eslint/camelcase": "off"
  }
};
