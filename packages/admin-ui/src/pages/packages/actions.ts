// INSTALLER
import { confirm } from "components/ConfirmDialog";
import { shortNameCapitalized as sn } from "utils/format";
import { api } from "api";
// Selectors
import { getDnpInstalledByDnpName } from "services/dnpInstalled/selectors";
import { withToastNoThrow } from "components/toast/Toast";
import { PackageEnvs } from "types";
import { AppThunk } from "store";
import { continueIfCalleDisconnected } from "api/utils";

// Used in package interface / envs

export const packageSetEnvironment = (
  dnpName: string,
  environmentByService: { [serviceName: string]: PackageEnvs },
  envNames?: string[]
): AppThunk => () => {
  const envList = (envNames || []).join(", ");
  withToastNoThrow(
    () => api.packageSetEnvironment({ dnpName, environmentByService }),
    {
      message: `Updating ${sn(dnpName)} ${envList}...`,
      onSuccess: `Updated ${sn(dnpName)} ${envList}`
    }
  );
};

// Used in package interface / controls

export const packageRestart = (dnpName: string): AppThunk => async (
  _,
  getState
) => {
  // If the DNP is not gracefully stopped, ask for confirmation to reset
  const dnp = getDnpInstalledByDnpName(getState(), dnpName);
  if (dnp && dnp.containers.some(container => container.running))
    await new Promise(resolve => {
      confirm({
        title: `Restarting ${sn(dnpName)}`,
        text: `This action cannot be undone. If this DAppNode Package holds state, it may be lost.`,
        label: "Restart",
        onClick: resolve
      });
    });

  await withToastNoThrow(
    // If call errors with "callee disconnected", resolve with success
    continueIfCalleDisconnected(() => api.packageRestart({ dnpName }), dnpName),
    {
      message: `Restarting ${sn(dnpName)}...`,
      onSuccess: `Restarted ${sn(dnpName)}`
    }
  );
};
