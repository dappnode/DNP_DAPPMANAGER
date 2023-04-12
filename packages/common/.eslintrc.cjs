module.exports = {
  extends: [
    "../../.eslintrc.cjs", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  rules: {
    // ##### @ts-ignore is needed in some cases
    "@typescript-eslint/ban-ts-comment": "off",
    // ##### Some schemas need a line length of more than 1000
    "max-len": "off",
    // Sometimes we need {} or Function as a type
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          "{}": false,
          Function: false,
        },
      },
    ],
  },
};
