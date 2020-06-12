// INSTALLER
import { confirm } from "components/ConfirmDialog";
import { shortNameCapitalized as sn } from "utils/format";
import { api } from "api";
// Selectors
import {
  getDnpInstalledById,
  getDependantsOfId
} from "services/dnpInstalled/selectors";
import { withToastNoThrow } from "components/toast/Toast";
import { PackageEnvs } from "types";
import { PackageContainer } from "common/types";
import { AppThunk } from "store";
import { continueIfCalleDisconnected } from "api/utils";

// Used in package interface / envs

export const updatePackageEnv = (
  id: string,
  envs: PackageEnvs
): AppThunk => () =>
  withToastNoThrow(() => api.updatePackageEnv({ id, envs }), {
    message: `Updating ${id} envs: ${Object.keys(envs).join(", ")}...`,
    onSuccess: `Updated ${id} envs`
  });

// Used in package interface / controls

export const togglePackage = (id: string): AppThunk => () =>
  withToastNoThrow(() => api.togglePackage({ id }), {
    message: `Toggling ${sn(id)}...`,
    onSuccess: `Toggled ${sn(id)}`
  });

export const restartPackage = (id: string): AppThunk => async (_, getState) => {
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
    continueIfCalleDisconnected(() => api.restartPackage({ id }), id),
    {
      message: `Restarting ${sn(id)}...`,
      onSuccess: `Restarted ${sn(id)}`
    }
  );
};

export const restartPackageVolumes = (id: string): AppThunk => async (
  _,
  getState
) => {
  // Make sure there are no colliding volumes with this DNP
  const dnp = getDnpInstalledById(getState(), id);

  if (dnp) {
    const warningsList: { title: string; body: string }[] = [];

    /**
     * If there are volumes which this DNP is the owner and some other
     * DNPs are users, they will be removed by the DAPPMANAGER.
     * Alert the user about this fact
     */
    const dnpsToRemove = getDnpsToRemove(dnp);
    if (dnpsToRemove.length)
      warningsList.push({
        title: "Warning! DAppNode Packages to be removed",
        body: `Some other DAppNode Packages will be reseted in order to remove ${id} volumes. \n\n ${dnpsToRemove
          .map(name => `- ${name}`)
          .join("\n")}`
      });

    // If there are NOT conflicting volumes,
    // Display a dialog to confirm volumes reset
    await new Promise(resolve =>
      confirm({
        title: `Removing ${sn(id)} data`,
        text: `This action cannot be undone. If this DAppNode Package is a blockchain node, it will lose all the chain data and start syncing from scratch.`,
        list: warningsList,
        label: "Remove volumes",
        onClick: resolve
      })
    );
  }

  await withToastNoThrow(() => api.restartPackageVolumes({ id }), {
    message: `Removing volumes of ${sn(id)}...`,
    onSuccess: `Removed volumes of ${sn(id)}`
  });
};

export const removePackage = (id: string): AppThunk => async (_, getState) => {
  const dnp = getDnpInstalledById(getState(), id);
  if (!dnp) throw Error(`DNP not found dnpList: ${id}`);

  // Dialog to confirm remove + USER INPUT for delete volumes
  const deleteVolumes = await new Promise(
    (resolve: (_deleteVolumes: boolean) => void) => {
      const title = `Removing ${sn(id)}`;
      let text = `This action cannot be undone.`;
      const buttons = [{ label: "Remove", onClick: () => resolve(false) }];
      if (areThereVolumesToRemove(dnp)) {
        // Only show the remove data related text if necessary
        text += ` If you do NOT want to keep ${id}'s data, remove it permanently clicking the "Remove and delete data" option.`;
        // Only display the "Remove and delete data" button if necessary
        buttons.push({
          label: "Remove and delete data",
          onClick: () => resolve(true)
        });
      }
      confirm({ title, text, buttons });
    }
  );

  const warningsList: { title: string; body: string }[] = [];
  // Don't show the same DNP in both dnpsToRemove and dependantsOf
  const dnpsToRemove = getDnpsToRemove(dnp);
  const dependantsOf = getDependantsOfId(getState(), id).filter(
    name => !dnpsToRemove.includes(name)
  );

  // dependantsOf = ["raiden.dnp.dappnode.eth", "another.dnp.dappnode.eth"]
  if (dependantsOf.length)
    warningsList.push({
      title: "Warning! There are package dependants",
      body: `Some DAppNode Packages depend on ${id} and may stop working if you continue. \n\n ${dependantsOf
        .map(name => `- ${name}`)
        .join("\n")}`
    });

  // dnpsToRemove = "raiden.dnp.dappnode.eth, another.dnp.dappnode.eth"
  if (dnpsToRemove.length)
    warningsList.push({
      title: "Warning! Other packages to be removed",
      body: `Some other DAppNode Packages will be removed as well because they are dependent on ${id} volumes. \n\n ${dnpsToRemove
        .map(name => `- ${name}`)
        .join("\n")}`
    });

  if (warningsList.length)
    await new Promise(resolve =>
      confirm({
        title: `Removing ${sn(id)}`,
        text: `This action cannot be undone.`,
        list: warningsList,
        label: "Continue",
        onClick: resolve
      })
    );

  await withToastNoThrow(() => api.removePackage({ id, deleteVolumes }), {
    message: `Removing ${sn(id)} ${deleteVolumes ? " and volumes" : ""}...`,
    onSuccess: `Removed ${sn(id)}`
  });
};

// File manager

/**
 * Re-used disclaimers and warnings
 */

/**
 * If there are volumes which this DNP is the owner and some other
 * DNPs are users, they will be removed by the DAPPMANAGER.
 * Alert the user about this fact
 * @param dnp DNP is installed object
 * @returns list of DNPs to remove
 */
function getDnpsToRemove(dnp: PackageContainer): string[] {
  const dnpsToRemove = new Set<string>();
  for (const vol of dnp.volumes || [])
    if (vol.name && vol.isOwner && vol.users && vol.users.length > 1)
      for (const dnpName of vol.users)
        if (dnpName !== dnp.name) dnpsToRemove.add(dnpName);
  return Array.from(dnpsToRemove);
}

/**
 * Checks if there are volumes to be removed on this DNP
 * @param dnp DNP is installed object
 * @returns
 */
function areThereVolumesToRemove(dnp: PackageContainer): boolean {
  return dnp.volumes && dnp.volumes.some(vol => vol.isOwner);
}
