// INSTALLER
import { confirm } from "components/ConfirmDialog";
import { shortNameCapitalized as sn } from "utils/format";
import { api } from "api";
// Selectors
import { getDnpInstalledById } from "services/dnpInstalled/selectors";
import { withToastNoThrow } from "components/toast/Toast";
import { PackageEnvs } from "types";
import { AppThunk } from "store";
import { continueIfCalleDisconnected } from "api/utils";

// Used in package interface / envs

export const packageSetEnvironment = (
  id: string,
  envs: PackageEnvs,
  envNames?: string[]
): AppThunk => () => {
  const envList = (envNames || Object.keys(envs)).join(", ");
  withToastNoThrow(() => api.packageSetEnvironment({ id, envs }), {
    message: `Updating ${sn(id)} ${envList}...`,
    onSuccess: `Updated ${sn(id)} ${envList}`
  });
};

// Used in package interface / controls

export const packageRestart = (id: string): AppThunk => async (_, getState) => {
  // If the DNP is not gracefully stopped, ask for confirmation to reset
  const dnp = getDnpInstalledById(getState(), id);
  if (!dnp || dnp.running || dnp.state !== "exited")
    await new Promise(resolve => {
      confirm({
        title: `Restarting ${sn(id)}`,
        text: `This action cannot be undone. If this DAppNode Package holds state, it may be lost.`,
        label: "Restart",
        onClick: resolve
      });
    });

  await withToastNoThrow(
    // If call errors with "callee disconnected", resolve with success
    continueIfCalleDisconnected(() => api.packageRestart({ id }), id),
    {
      message: `Restarting ${sn(id)}...`,
      onSuccess: `Restarted ${sn(id)}`
    }
  );
};
