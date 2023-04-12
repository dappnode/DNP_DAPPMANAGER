module.exports = {
  extends: [
    "../../.eslintrc.cjs" // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  ignorePatterns: [
    "/src/modules/chains/drivers/bitcoin.ts",
    "src/modules/chains/drivers/monero.ts",
    "src/modules/ipfs/writeStreamToFs.ts"
  ],
  rules: {
    // ##### Some libraries do not have typings and the compiler does not understand .d.ts files
    "@typescript-eslint/no-var-requires": "off",
    // ##### typescript does not understand hoisting
    "@typescript-eslint/no-use-before-define": "off",
    // ### This project uses docker-compose which has many variables not in camelCase
    "@typescript-eslint/camelcase": "off"
  }
};
