import fs from "fs";

export const testDir = "test_files";

export async function cleanTestDir(): Promise<void> {
  fs.rmdirSync(testDir, { recursive: true });
}
