import { FlatCompat } from "@eslint/eslintrc";
import { parse } from "@typescript-eslint/parser";
import path from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname, // optional
  recommendedConfig: js.configs.recommended, // optional unless using "eslint:recommended"
  allConfig: js.configs.all // optional unless using "eslint:all"
});

export default [
  {
    // Basic settings
    languageOptions: {
      parser: parse,
      parserOptions: {
        project: "./tsconfig.json", // Adjust path if necessary
        tsconfigRootDir: __dirname,
        sourceType: "module"
      }
    },
    ignores: ["node_modules", "packages/*/dist", "packages/*/node_modules", "packages/*/build"]
  },

  // Optionally, add compatibility with old configs
  ...compat.config({
    plugins: ["@typescript-eslint", "prettier"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
    rules: {
      "prettier/prettier": "error",
      "no-unused-expressions": "off", // Disable standard no-unused-expressions rule
      "@typescript-eslint/no-unused-expressions": "off", // Disable TypeScript-specific rule
      "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }]
    }
  })
];
