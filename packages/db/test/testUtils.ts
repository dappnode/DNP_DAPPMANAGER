import { shell } from "@dappnode/utils";

export const testDir = "./test_files/";

export const beforeAndAfter = (
  ...args: Parameters<Mocha.HookFunction>
): void => {
  before(...args);
  after(...args);
};

export async function createTestDir(): Promise<void> {
  await cleanTestDir();
  await shell(`mkdir -p ${testDir}`);
}

export async function cleanTestDir(): Promise<void> {
  await shell(`rm -rf ${testDir}`);
}
