import { editCoreSetting, MY_PACKAGES, SYSTEM_PACKAGES, editDnpSetting } from "@dappnode/daemons";

/**
 * Edits the auto-update settings
 *
 * @param id = "my-packages", "system-packages" or "bitcoin.dnp.dappnode.eth"
 * @param enabled Auto update is enabled for ID
 */
export async function autoUpdateSettingsEdit({
  id,
  enabled,
  applyToAll
}: {
  id: string;
  enabled: boolean;
  applyToAll?: boolean;
}): Promise<void> {
  if (!id) throw Error(`Argument id is required or generalSettings must be true`);

  if (id === MY_PACKAGES) editDnpSetting(enabled, MY_PACKAGES, applyToAll);
  else if (id === SYSTEM_PACKAGES) editCoreSetting(enabled);
  else editDnpSetting(enabled, id);
}
