import { FullBackupProgress, FullBackupStatus } from "@dappnode/types";

/**
 * Simulated full backup, shared by the mock createFullBackup route and the
 * mock fullBackupStatus call, so the progress view can be seen in mock mode
 */
let progress: FullBackupProgress | undefined;

const packages = ["rotki.dnp.dappnode.eth", "web3signer.dnp.dappnode.eth", "lighthouse.dnp.dappnode.eth"];
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function runMockFullBackup(): Promise<void> {
  const current: FullBackupProgress = {
    step: "preparing",
    startedAt: new Date().toISOString(),
    packagesDone: 0,
    packagesTotal: packages.length,
    copiedBytes: 0,
    archivedBytes: 0,
    archiveTotalBytes: 0
  };
  progress = current;
  try {
    await sleep(800);
    for (const dnpName of packages) {
      current.dnpName = dnpName;
      const validator = dnpName.includes("web3signer");
      if (validator) {
        current.step = "stopping";
        await sleep(1200);
      }
      current.step = "copying";
      for (let i = 0; i < 5; i++) {
        current.copiedBytes += 12_000_000;
        await sleep(200);
      }
      if (validator) {
        current.step = "restarting";
        await sleep(800);
      }
      current.packagesDone++;
    }
    current.dnpName = undefined;
    current.step = "archiving";
    current.archiveTotalBytes = current.copiedBytes;
    while (current.archivedBytes < current.archiveTotalBytes) {
      current.archivedBytes = Math.min(current.archiveTotalBytes, current.archivedBytes + 6_000_000);
      await sleep(150);
    }
  } finally {
    progress = undefined;
  }
}

export function mockFullBackupStatus(): FullBackupStatus {
  return { inProgress: Boolean(progress), ...(progress ? { progress: { ...progress } } : {}) };
}
