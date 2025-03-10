import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("@typescript-eslint/utils").TSESLint.Linter.Config} */
const config = tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unused-expressions": "off",
    "no-unexpected-multiline": "off"
  }
});

export default config;
