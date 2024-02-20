module.exports = {
  extends: [
    "../../.eslintrc.cjs", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
    ignorePatterns: [
    "/src/drivers/bitcoin.ts",
    "src/drivers/monero.ts",
    ]
}