/**
 * Stores the last unix timestamp a package was attempted to be installed
 * - If all go well, when an installation is completed this number
 *   should be reseted to 0. If for some reason it doesn't, it will act
 *   as a timeout to allow installation retries even if the packages
 *   are not unflagged correctly
 *
 * Store in memory because if the DAPPMANAGER is reseted all installations are stopped
 */
const lastInstallTimestamp = new Map<string, number>();
const isInstallingTimeout = 5 * 60 * 1000; // 5 min (ms)

export function flagPackagesAreInstalling(dnpNames: string[]): void {
  for (const dnpName of dnpNames) lastInstallTimestamp.set(dnpName, Date.now());
}

export function flagPackagesAreNotInstalling(dnpNames: string[]): void {
  for (const dnpName of dnpNames) lastInstallTimestamp.set(dnpName, 0);
}

export function packageIsInstalling(dnpName: string): boolean {
  const lastInstallAttempt = lastInstallTimestamp.get(dnpName);
  if (!lastInstallAttempt) return false;
  else return Date.now() - lastInstallAttempt < isInstallingTimeout;
}
