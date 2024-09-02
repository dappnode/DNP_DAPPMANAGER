import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

export const testDir = join(dirname(fileURLToPath(import.meta.url)), "test_files");

export function cleanTestDir() {
  if (fs.existsSync(testDir)) fs.rmdirSync(testDir, { recursive: true });
  fs.mkdirSync(testDir);
}
