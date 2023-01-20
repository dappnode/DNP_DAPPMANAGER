// INSTALLER
import { confirm } from "components/ConfirmDialog";
import { prettyDnpName, prettyFullName } from "utils/format";
import { api } from "api";
// Selectors
import { withToastNoThrow } from "components/toast/Toast";
import { InstalledPackageData, PackageContainer } from "@dappnode/common";
import { continueIfCalleDisconnected } from "api/utils";
import { PackageEnvs } from "@dappnode/dappnodesdk";

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
      message: `Updating ${prettyDnpName(dnpName)} ${envList}...`,
      onSuccess: `Updated ${prettyDnpName(dnpName)} ${envList}`
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
    ? [prettyFullName(container)].join(" ")
    : prettyDnpName(dnpName);

  // If the DNP is not gracefully stopped, ask for confirmation to reset
  if (dnp && dnp.containers.some(container => container.running))
    await new Promise<void>(resolve => {
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
