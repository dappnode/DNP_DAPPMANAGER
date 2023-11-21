import fs from "fs";
import { shell } from "@dappnode/utils";

export const testDir = "test_files";

export async function cleanTestDir(): Promise<void> {
  await shell(`rm -rf ${testDir}`);
  fs.mkdirSync(testDir, { recursive: true });
}
