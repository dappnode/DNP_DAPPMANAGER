import * as db from "../db";

const isInstallingTimeout = 5 * 60 * 1000; // 5 min (ms)

export function flagPackagesAreInstalling(dnpNames: string[]): void {
  for (const dnpName of dnpNames) flagPackageIsInstalling(dnpName);
}

export function flagPackagesAreNotInstalling(dnpNames: string[]): void {
  for (const dnpName of dnpNames) flagPackageIsNotInstalling(dnpName);
}

export function flagPackageIsInstalling(dnpName: string): void {
  db.packageIsInstalling.set(dnpName, Date.now());
}

export function flagPackageIsNotInstalling(dnpName: string): void {
  db.packageIsInstalling.set(dnpName, 0);
}

export function packageIsInstalling(dnpName: string): boolean {
  const lastInstallAttempt = db.packageIsInstalling.get(dnpName);
  if (!lastInstallAttempt) return false;
  return Date.now() - lastInstallAttempt < isInstallingTimeout;
}
