module.exports = {
  extends: [
    "../../.eslintrc.cjs" // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  ignorePatterns: [
    "/src/modules/chains/drivers/bitcoin.ts",
    "src/modules/chains/drivers/monero.ts",
    "src/modules/ipfs/writeStreamToFs.ts"
  ]
};
