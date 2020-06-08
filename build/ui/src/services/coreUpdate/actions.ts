import { api } from "api";
import { coreUpdate } from "./reducer";
import { AppThunk } from "store";
import { coreName } from "params";
import { getUpdatingCore } from "./selectors";
import { withToast } from "components/toast/Toast";
import { clearIsInstallingLog } from "services/isInstallingLogs/actions";

/**
 * To modify the core version for DEV ONLY purposes, do
 *   localStorage.setItem('DEVONLY-core-id', 'core.dnp.dappnode.eth@/ipfs/Qm5sxx...');
 *    or
 *   setCoreIdIpfs('/ipfs/Qm5sxx...')
 *    or
 *   setCoreId('core.dnp.dappnode.eth@0.1.1')
 *    then
 *   restoreCoreId()
 * And refresh the page
 */

declare global {
  interface Window {
    setCoreVersion: (version: string) => string;
    restoreCoreId: () => string;
  }
}

const coreVersionLocalStorageTag = "DEVONLY-core-version";
const coreVersionDevSet = localStorage.getItem(coreVersionLocalStorageTag);
// Methods to edit the coreID
window.setCoreVersion = (version: string) => {
  localStorage.setItem(coreVersionLocalStorageTag, version);
  return `Set core version to version ${version}`;
};
window.restoreCoreId = () => {
  localStorage.removeItem(coreVersionLocalStorageTag);
  return `Deleted custom DEVONLY core version setting`;
};

const version = coreVersionDevSet || undefined;

// Service > coreUpdate

const updateCoreUpdateData = coreUpdate.actions.data;
const updateUpdatingCore = coreUpdate.actions.updatingCore;
const updateCoreRequestStatus = coreUpdate.actions.requestStatus;

/**
 * Does a call to `api.resolveRequest` with `id = core.dnp.dappnode.eth@latest`
 * to know if there is an update available. If so, it fetches the manifests
 * of the core DNP and all the necessary dependencies
 */
export const fetchCoreUpdateData = (): AppThunk => async dispatch => {
  try {
    dispatch(updateCoreRequestStatus({ loading: true }));
    const coreUpdateData = await api.fetchCoreUpdateData({ version });
    dispatch(updateCoreRequestStatus({ success: true }));
    dispatch(updateCoreUpdateData(coreUpdateData));

    /* Log out current state */
    console.log(
      `DAppNode ${coreName} (${coreUpdateData.versionId})`,
      coreUpdateData
    );
  } catch (e) {
    dispatch(updateCoreRequestStatus({ error: e.message }));
    console.error(`Error on checkCoreUpdate: ${e.stack}`);
  }
};

/**
 * Calls `api.install` to update the DAppNode core.
 * - Has a protection to prevent double updates.
 * - Calls checkCoreUpdate afterwards to refresh the warnings that there is an update available
 */

export const updateCore = (): AppThunk => async (dispatch, getState) => {
  try {
    // Prevent double installations
    if (getUpdatingCore(getState()))
      return console.error("Error: DAppNode core is already updating");

    // blacklist the current package
    dispatch(updateUpdatingCore(true));

    await withToast(
      () =>
        api.installPackage({
          name: coreName,
          version,
          options: { BYPASS_CORE_RESTRICTION: true, BYPASS_RESOLVER: true }
        }),
      {
        message: "Updating DAppNode core...",
        onSuccess: "Updated DAppNode core"
      }
    );

    // Remove package from blacklist
    dispatch(updateUpdatingCore(false));

    // Clear progressLogs, + Removes DNP from blacklist
    dispatch(clearIsInstallingLog({ id: coreName }));

    // Call checkCoreUpdate to compute hide the "Update" warning and buttons
    dispatch(fetchCoreUpdateData());
  } catch (e) {
    console.error(`Error on updateCore: ${e.stack}`);
  }
};
