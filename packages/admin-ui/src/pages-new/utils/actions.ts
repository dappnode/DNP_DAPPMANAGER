import { api } from "api";
import { toast } from "sonner";

/**
 * Remove an orphan volume by name.
 * Confirmation is handled by the caller via AlertDialog.
 */
export async function volumeRemove(name: string): Promise<void> {
  const toastId = toast.loading("Removing volume...");
  try {
    await api.volumeRemove({ name });
    toast.success("Removed volume", { id: toastId });
  } catch (e) {
    toast.error(`Error removing volume: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
  }
}

/**
 * Remove a package-owned volume.
 * Confirmation is handled by the caller via AlertDialog.
 */
export async function packageVolumeRemove(dnpName: string, volName: string): Promise<void> {
  const toastId = toast.loading("Removing volume...");
  try {
    await api.packageRestartVolumes({ dnpName, volumeId: volName });
    toast.success("Removed volume", { id: toastId });
  } catch (e) {
    toast.error(`Error removing volume: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
  }
}

/**
 * Change the host user password.
 * Confirmation is handled by the caller via AlertDialog.
 */
export async function passwordChange(newPassword: string): Promise<void> {
  const toastId = toast.loading("Changing host user password...");
  try {
    await api.passwordChange({ newPassword });
    toast.success("Changed host user password", { id: toastId });
  } catch (e) {
    toast.error(`Error changing password: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
  }
}
