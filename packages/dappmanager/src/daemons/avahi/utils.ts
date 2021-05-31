import { shellHost } from "../../utils/shell";
import { pause } from "../../utils/asyncFlows";
import * as db from "../../db";

/**  Waits for internal IP to be available */
export async function waitForIps(): Promise<{
  internalIp: string;
  publicIp: string;
}> {
  while (true) {
    const internalIp = db.internalIp.get();
    const publicIp = db.publicIp.get();
    if (internalIp && publicIp) return { internalIp, publicIp };
    await pause(1000);
  }
}

/** Check if AVAHI daemon is running or not */
export async function isAvahiDaemonRunning(): Promise<boolean> {
  try {
    await shellHost("avahi-daemon -- --check");
    return true;
  } catch (e) {
    // avahi-daemon -- --check: Return 0 as return code when avahi-daemon is already running.
    return false;
  }
}

/** Check if AVAHI daemon is installed on host */
export async function isAvahiDaemonInstalled(): Promise<boolean> {
  try {
    await shellHost("avahi-daemon -- --check");
    return true;
  } catch (e) {
    // Example of output if avahi-daemon is not installed: nsenter: can't execute 'avahi-daemon': No such file or directory
    if (e.includes("No such file")) return false;
    throw Error("Unknown");
  }
}

/** Installs AVAHI daemon on host */
export async function installAvahiDaemon(): Promise<void> {
  await shellHost("apt-get install avahi-daemon");
}

/** Starts AVAHI daemon on host */
export async function startAvahiDaemonOnHost(): Promise<void> {
  await shellHost("systemctl start avahi-daemon");
}
