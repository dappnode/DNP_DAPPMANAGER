// INSTALLER
import { confirm } from "components/ConfirmDialog";
import { shortNameCapitalized as sn } from "utils/format";
import { api } from "api";
// Selectors
import { withToastNoThrow } from "components/toast/Toast";
import { PackageEnvs, InstalledPackageData } from "types";
import { continueIfCalleDisconnected } from "api/utils";
import { PackageContainer } from "common";

// Used in package interface / envs

export async function packageSetEnvironment(
  dnpName: string,
  environmentByService: { [serviceName: string]: PackageEnvs },
  envNames?: string[]
): Promise<void> {
  const envList = (envNames || []).join(", ");
  await withToastNoThrow(
    () => api.packageSetEnvironment({ dnpName, environmentByService }),
    {
      message: `Updating ${sn(dnpName)} ${envList}...`,
      onSuccess: `Updated ${sn(dnpName)} ${envList}`
    }
  );
}

// Used in package interface / controls

export async function packageRestart(
  dnp: InstalledPackageData,
  container?: PackageContainer
): Promise<void> {
  // Restart only a single service container
  const serviceNames = container && [container.serviceName];

  const dnpName = dnp.dnpName;
  const name = container
    ? [sn(dnpName), sn(container.serviceName)].join(" ")
    : sn(dnpName);

  // If the DNP is not gracefully stopped, ask for confirmation to reset
  if (dnp && dnp.containers.some(container => container.running))
    await new Promise(resolve => {
      confirm({
        title: `Restarting ${name}`,
        text: `This action cannot be undone. If this DAppNode Package holds state, it may be lost.`,
        label: "Restart",
        onClick: resolve
      });
    });

  await withToastNoThrow(
    // If call errors with "callee disconnected", resolve with success
    continueIfCalleDisconnected(
      () => api.packageRestart({ dnpName, serviceNames }),
      dnpName
    ),
    {
      message: `Restarting ${name}...`,
      onSuccess: `Restarted ${name}`
    }
  );
}
