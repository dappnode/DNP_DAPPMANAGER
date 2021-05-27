import { LocalProxyingStatus } from "../types";
import { avahiController } from "../daemons/avahi";
import { ComposeFileEditor } from "../modules/compose/editor";
import params from "../params";
import { packageSetEnvironment } from "./packageSetEnvironment";

/**
 * Local proxying allows to access the admin UI through my.dappnode.local.
 * When disabling this feature:
 * - Remove NGINX logic in HTTPs Portal to route .local domains
 * - Stop exposing the port 80 to the local network
 * - Stop broadcasting .local domains to mDNS
 */
export async function localProxyingEnableDisable(
  enable: boolean
): Promise<void> {
  await packageSetEnvironment({
    dnpName: params.HTTPS_PORTAL_DNPNAME,
    environmentByService: {
      [params.HTTPS_PORTAL_MAIN_SERVICE]: {
        [params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME]: enable ? "true" : "false"
      }
    }
  });

  // TODO: Stop exposing port 80

  if (enable) {
    await avahiController.start();
  } else {
    avahiController.stop();
  }
}

/**
 * Local proxying allows to access the admin UI through my.dappnode.local.
 * Return current status of:
 * - NGINX is routing .local domains
 * - Port 80 is exposed
 * - Is broadcasting to mDNS
 */
export async function localProxyingStatusGet(): Promise<LocalProxyingStatus> {
  const userSettings = ComposeFileEditor.getUserSettingsIfExist(
    params.HTTPS_PORTAL_DNPNAME,
    params.HTTPS_PORTAL_ISCORE
  );

  const LOCAL_PROXYING =
    userSettings.environment?.[params.HTTPS_PORTAL_MAIN_SERVICE]?.[
      params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME
    ];

  // https://github.com/dappnode/DNP_HTTPS/blob/2a52450061eb3b0c4bc321e9b75547661cba1017/fs_overlay/var/lib/nginx-conf/nginx.conf.erb#L115
  // if ENV['LOCAL_PROXYING'].downcase == 'true'
  const localProxyingEnabled = String(LOCAL_PROXYING).toLowerCase() === "true";

  return {
    avahiPublishCmdState: avahiController.state,
    localProxyingEnabled
  };
}
