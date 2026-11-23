import { params } from "@dappnode/params";
import { dockerComposeStart, dockerComposeStop, dockerContainerStart } from "@dappnode/dockerapi";
import { getDockerComposePath } from "@dappnode/utils";
import { InstalledPackageData } from "@dappnode/types";

/**
 * Packages that are never stopped to copy their backup data, even if that
 * makes the copy best-effort: system packages (stopping the VPN or Wi-Fi
 * could cut the admin's own connection mid-backup) and packages the admin
 * may be using to reach this node. Tailscale writes its state atomically,
 * so a live copy of it is consistent anyway.
 */
const NEVER_STOP_FOR_BACKUP = new Set([params.dappmanagerDnpName, "tailscale.dnp.dappnode.eth"]);

export function canStopForBackup(pkg: Pick<InstalledPackageData, "dnpName" | "isCore">): boolean {
  return !pkg.isCore && !NEVER_STOP_FOR_BACKUP.has(pkg.dnpName);
}

/** Starts again exactly the containers a stop took down */
export type RestartPackage = () => Promise<void>;

/**
 * Gracefully stop a package so its backup data can be copied consistently:
 * databases are closed and validators can no longer sign. Uses
 * `docker compose stop`, which stops dependants before their dependencies
 * and waits for each service's `stop_grace_period`; a manifest
 * `dockerTimeout` is passed as the timeout when set.
 *
 * Returns how to restart it, or null if nothing was running.
 */
export async function stopPackageForBackup(pkg: InstalledPackageData): Promise<RestartPackage | null> {
  const running = pkg.containers.filter((c) => c.running);
  if (running.length === 0) return null;

  const composePath = getDockerComposePath(pkg.dnpName, pkg.isCore);
  const timeouts = pkg.containers.map((c) => c.dockerTimeout).filter((t): t is number => typeof t === "number");
  await dockerComposeStop(composePath, timeouts.length > 0 ? { timeout: Math.max(...timeouts) } : {});

  const allWereRunning = running.length === pkg.containers.length;
  return async () => {
    if (allWereRunning) {
      await dockerComposeStart(composePath);
    } else {
      // Keep containers the user had stopped stopped
      for (const container of running) await dockerContainerStart(container.containerName);
    }
  };
}
