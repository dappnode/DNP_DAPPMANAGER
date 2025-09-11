import { confirm } from "components/ConfirmDialog";
import { api } from "api";
import { prettyDnpName, prettyVolumeName } from "utils/format";
// Selectors
import { withToastNoThrow } from "components/toast/Toast";
import { AppThunk } from "store";

// Redux Thunk actions

export const passwordChangeInBackground = (newPassword: string): AppThunk => async () => {
  await api.passwordChange({ newPassword }).catch(console.error);
};

export const passwordChange = (newPassword: string): AppThunk => async () => {
  // Display a dialog to confirm the password change
  await new Promise<void>((resolve) =>
    confirm({
      title: `Changing host user password`,
      text: `Make sure to safely store this password and keep a back up. \n\nYou will never be able to see this password again. If you lose it, you will not be able to recover it in any way.`,
      label: "Change",
      variant: "dappnode",
      onClick: resolve
    })
  );

  await withToastNoThrow(() => api.passwordChange({ newPassword }), {
    message: `Changing host user password...`,
    onSuccess: `Changed host user password`
  });
};

export const volumeRemove = (name: string): AppThunk => async () => {
  // Display a dialog to confirm the password change
  await new Promise<void>((resolve) =>
    confirm({
      title: `Removing volume`,
      text: `Are you sure you want to permanently remove volume ${name}?`,
      label: "Remove",
      variant: "danger",
      onClick: resolve
    })
  );

  await withToastNoThrow(() => api.volumeRemove({ name }), {
    message: `Removing volume...`,
    onSuccess: `Removed volume`
  });
};

export const packageVolumeRemove = (dnpName: string, volName: string): AppThunk => async () => {
  // Make sure there are no colliding volumes with this DNP
  const prettyVolName = prettyVolumeName(volName, dnpName).name;
  const prettyVolRef = `${prettyDnpName(dnpName)} ${prettyVolName} volume`;

  const warningsList: { title: string; body: string }[] = [];

  // If there are NOT conflicting volumes,
  // Display a dialog to confirm volumes reset
  await new Promise<void>((resolve) =>
    confirm({
      title: `Removing ${prettyVolRef}`,
      text: `Are you sure you want to permanently remove this volume? This action cannot be undone. If this DAppNode Package is a blockchain node, it will lose all the chain data and start syncing from scratch.`,
      list: warningsList,
      label: "Remove",
      onClick: resolve
    })
  );

  await withToastNoThrow(() => api.packageRestartVolumes({ dnpName, volumeId: volName }), {
    message: `Removing ${prettyVolRef}...`,
    onSuccess: `Removed ${prettyVolRef}`
  });
};
