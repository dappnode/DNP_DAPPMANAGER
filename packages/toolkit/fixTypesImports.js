import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Define the file path
const __dirname = process.cwd();
const filePath = join(__dirname, "src", "typechain", "index.ts");

try {
  // Read the content of the file
  const data = readFileSync(filePath, "utf8");

  // Modify the regular expression to correctly match the import lines
  const regex =
    /(import type \* as contractsV0[45] from "\.\/contracts_v0\.[45])"/g;

  // Replace the specific lines, ensuring that /index.js is inside the quotes
  const result = data.replace(regex, '$1/index.js"');

  // Write the file back
  writeFileSync(filePath, result, "utf8");
} catch (err) {
  console.error(err);
}
