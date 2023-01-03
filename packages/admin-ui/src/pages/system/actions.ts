import { confirm } from "components/ConfirmDialog";
import { api } from "api";
import { prettyDnpName, prettyVolumeName } from "utils/format";
// External actions
import { fetchPasswordIsSecure } from "services/dappnodeStatus/actions";
// Selectors
import { getEthClientTarget } from "services/dappnodeStatus/selectors";
import { withToastNoThrow } from "components/toast/Toast";
import { AppThunk } from "store";
import { Eth2ClientTarget } from "@dappnode/common";
import { isEqual } from "lodash-es";

// Redux Thunk actions

export const changeEthClientTarget = (
  nextTarget: Eth2ClientTarget,
  useCheckpointSync?: boolean
): AppThunk => async (_, getState) => {
  const prevTarget = getEthClientTarget(getState());

  // Make sure the target has changed or the call will error
  if (isEqual(nextTarget, prevTarget)) return;

  // If the previous target is package, ask the user if deleteVolumes
  let deletePrevExecClient = false;
  let deletePrevExecClientVolumes = false;
  let deletePrevConsClient = false;
  let deletePrevConsClientVolumes = false;
  if (prevTarget && prevTarget !== "remote") {
    if (
      nextTarget === "remote" ||
      nextTarget.execClient !== prevTarget.execClient
    ) {
      await new Promise<void>(resolve =>
        confirm({
          title: `Remove ${prettyDnpName(prevTarget.execClient)}?`,
          text: `Do you want to remove your current Execution Layer (EL) client? This action cannot be undone. You can keep the data volume to avoid needing to resync from scratch next time you install the same EL client. Keeping the data volume will NOT clear space in your hard drive.`,
          buttons: [
            {
              label: "Keep node running",
              variant: "danger",
              onClick: () => {
                deletePrevExecClient = false;
                deletePrevExecClientVolumes = false;
                resolve();
              }
            },
            {
              label: "Remove and keep volumes",
              variant: "warning",
              onClick: () => {
                deletePrevExecClient = true;
                deletePrevExecClientVolumes = false;
                resolve();
              }
            },
            {
              label: "Remove and delete volumes",
              variant: "dappnode",
              onClick: () => {
                deletePrevExecClient = true;
                deletePrevExecClientVolumes = true;
                resolve();
              }
            }
          ]
        })
      );
    }

    // If the previous target is package, ask the user if deleteVolumes
    if (
      nextTarget === "remote" ||
      nextTarget.consClient !== prevTarget.consClient
    ) {
      await new Promise<void>(resolve =>
        confirm({
          title: `Remove ${prettyDnpName(prevTarget.consClient)}?`,
          text: `Do you want to remove your current Consensus Layer (CL) client? This action cannot be undone. You can keep the volume data to avoid resyncing from scratch next time you install the same CL client. Keeping the volume will NOT clear space in your hard drive.`,
          buttons: [
            {
              label: "Keep node running",
              variant: "danger",
              onClick: () => {
                deletePrevConsClient = false;
                deletePrevConsClientVolumes = false;
                resolve();
              }
            },
            {
              label: "Remove and keep volumes",
              variant: "warning",
              onClick: () => {
                deletePrevConsClient = true;
                deletePrevConsClientVolumes = false;
                resolve();
              }
            },
            {
              label: "Remove and delete volumes",
              variant: "dappnode",
              onClick: () => {
                deletePrevConsClient = true;
                deletePrevConsClientVolumes = true;
                resolve();
              }
            }
          ]
        })
      );
    }
  }

  await withToastNoThrow(
    () =>
      api.ethClientTargetSet({
        target: nextTarget,
        sync: false,
        useCheckpointSync,
        deletePrevExecClient,
        deletePrevExecClientVolumes,
        deletePrevConsClient,
        deletePrevConsClientVolumes
      }),
    {
      message: "Changing Ethereum client...",
      onSuccess: `Changed Ethereum client`
    }
  );
};

export const passwordChangeInBackground = (
  newPassword: string
): AppThunk => async dispatch => {
  await api.passwordChange({ newPassword }).catch(console.error);

  dispatch(fetchPasswordIsSecure());
};

export const passwordChange = (
  newPassword: string
): AppThunk => async dispatch => {
  // Display a dialog to confirm the password change
  await new Promise<void>(resolve =>
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

  dispatch(fetchPasswordIsSecure());
};

export const volumeRemove = (name: string): AppThunk => async dispatch => {
  // Display a dialog to confirm the password change
  await new Promise<void>(resolve =>
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

export const packageVolumeRemove = (
  dnpName: string,
  volName: string
): AppThunk => async () => {
  // Make sure there are no colliding volumes with this DNP
  const prettyVolName = prettyVolumeName(volName, dnpName).name;
  const prettyVolRef = `${prettyDnpName(dnpName)} ${prettyVolName} volume`;

  const warningsList: { title: string; body: string }[] = [];

  // If there are NOT conflicting volumes,
  // Display a dialog to confirm volumes reset
  await new Promise<void>(resolve =>
    confirm({
      title: `Removing ${prettyVolRef}`,
      text: `Are you sure you want to permanently remove this volume? This action cannot be undone. If this DAppNode Package is a blockchain node, it will lose all the chain data and start syncing from scratch.`,
      list: warningsList,
      label: "Remove",
      onClick: resolve
    })
  );

  await withToastNoThrow(
    () => api.packageRestartVolumes({ dnpName, volumeId: volName }),
    {
      message: `Removing ${prettyVolRef}...`,
      onSuccess: `Removed ${prettyVolRef}`
    }
  );
};
