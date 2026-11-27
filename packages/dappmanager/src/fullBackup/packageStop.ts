import { params } from "@dappnode/params";
import { dockerComposeStart, dockerComposeStop, listPackageNoThrow } from "@dappnode/dockerapi";
import { getDockerComposePath } from "@dappnode/utils";
import { InstalledPackageData, PackageContainer } from "@dappnode/types";

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

/** Docker calls, injectable for tests */
export interface PackageStopDocker {
  composeStop: typeof dockerComposeStop;
  composeStart: typeof dockerComposeStart;
  listPackage: typeof listPackageNoThrow;
}

const defaultDocker: PackageStopDocker = {
  composeStop: dockerComposeStop,
  composeStart: dockerComposeStart,
  listPackage: listPackageNoThrow
};

/** Runs now, or comes back by itself: docker starts a `restarting` container again */
function isActive(container: Pick<PackageContainer, "running" | "state">): boolean {
  return container.running || container.state === "restarting";
}

/**
 * Gracefully stop a package so its backup data can be copied consistently:
 * databases are closed and validators can no longer sign. Uses
 * `docker compose stop`, which stops dependants before their dependencies
 * and waits for each service's `stop_grace_period`; a manifest
 * `dockerTimeout` is passed as the timeout when set.
 *
 * Resolves only once no container of the package runs: returns how to
 * restart it, or null if nothing was running. If the stop fails, the
 * containers it did stop are started again before the error is thrown.
 */
export async function stopPackageForBackup(
  pkg: InstalledPackageData,
  docker: PackageStopDocker = defaultDocker
): Promise<RestartPackage | null> {
  const active = pkg.containers.filter(isActive);
  const composePath = getDockerComposePath(pkg.dnpName, pkg.isCore);
  // `docker compose start` follows `depends_on` and `pid: service:` order,
  // which starting the containers one by one does not. Naming the services
  // keeps the ones the user had stopped stopped, unless a named one depends
  // on them
  const services = active.map((c) => c.serviceName);
  const restart: RestartPackage | null =
    active.length > 0
      ? async () => {
          await docker.composeStart(composePath, services);
        }
      : null;

  try {
    if (active.length > 0) {
      const timeouts = pkg.containers.map((c) => c.dockerTimeout).filter((t): t is number => typeof t === "number");
      await docker.composeStop(composePath, timeouts.length > 0 ? { timeout: Math.max(...timeouts) } : {});
    }
    const stopped = await docker.listPackage({ dnpName: pkg.dnpName });
    const stillActive = (stopped?.containers ?? []).filter(isActive).map((c) => c.serviceName);
    if (stillActive.length > 0) throw Error(`these services are still running: ${stillActive.join(", ")}`);
  } catch (e) {
    // A stop that failed part-way has taken some containers down
    try {
      if (restart) await restart();
    } catch (restartError) {
      throw Error(`${e.message}. It could not be started again, start it from its page: ${restartError.message}`);
    }
    throw e;
  }
  return restart;
}
