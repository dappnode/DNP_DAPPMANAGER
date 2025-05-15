import { ComposeFileEditor } from "@dappnode/dockercompose";
import { listContainer, logContainer } from "@dappnode/dockerapi";
import { CurrentWifiCredentials, WifiReport, Category, Priority, Status } from "@dappnode/types";
import { params } from "@dappnode/params";
import { notifications } from "@dappnode/notifications";

let wifiDefaultPasswordNotificationSent = false;

/**
 * Return wifi report
 */
export async function wifiReportGet(): Promise<WifiReport> {
  const wifiContainer = await listContainer({
    containerName: params.wifiContainerName
  });
  if (!wifiContainer) throw Error(`Wifi not installed`);

  // exitCode 0 means that wifi package was manually stopped. No errors
  if (wifiContainer.exitCode === 0) wifiContainer.state === "paused";

  let report;
  let info = "";

  switch (wifiContainer.state) {
    case "created":
      info = "Wifi has not been initialized yet";
      break;
    case "running":
      info = "Wifi is currently running";
      break;
    case "restarting":
      info = "Wifi restarting. Wait until it starts";
      break;
    case "dead":
      info = "Wifi service dead, you must manually remove it and install it again";
      report = {
        lastLog: parseWifiLogs(await getWifiLastLog()),
        exitCode: wifiContainer.exitCode
      };
      break;
    case "exited":
      info = "Wifi service exited due to an internal error";
      report = {
        lastLog: parseWifiLogs(await getWifiLastLog()),
        exitCode: wifiContainer.exitCode
      };
      break;
    case "paused":
      info = "Wifi service is paused. Restart wifi to get back access again";
      break;
  }

  const { password } = await wifiCredentialsGet();
  const isDefaultPassphrase = password === params.WIFI_DEFAULT_PASSWORD;

  // Send notification if the password is insecure. Only once in the app lifetime
  if (isDefaultPassphrase && !wifiDefaultPasswordNotificationSent) {
    try {
      await notifications
        .sendNotification({
          title: "Default WiFi Password",
          dnpName: params.dappmanagerDnpName,
          body: `Your Dappnode WiFi is using the default password. For security reasons, it's strongly recommended to change it to a custom, secure password.`,
          category: Category.system,
          priority: Priority.high,
          status: Status.triggered,
          callToAction: {
            title: "Change",
            url: "http://my.dappnode/system/wifi"
          },
          isBanner: true,
          isRemote: false,
          correlationId: "core-wifi-default-password"
        })
        .catch((e) => console.error("Error sending wifi password notification", e));
      wifiDefaultPasswordNotificationSent = true;
    } catch (e) {
      console.error("Error sending wifi password notification", e);
    }
  }

  return {
    info,
    report,
    isDefaultPassphrase,
    isRunning: wifiContainer.state === "running"
  };
}

/**
 * Returns wifi credentials
 */
export async function wifiCredentialsGet(): Promise<CurrentWifiCredentials> {
  const composeWifi = new ComposeFileEditor(params.wifiDnpName, true);
  const wifiService = composeWifi.services()[params.wifiDnpName];
  const wifiEnvs = wifiService.getEnvs();
  if (wifiEnvs[params.WIFI_KEY_SSID] === undefined || wifiEnvs[params.WIFI_KEY_PASSWORD] === undefined)
    throw Error("Wifi SSID and/or Wifi password does not exist on compose file");
  return {
    ssid: wifiEnvs[params.WIFI_KEY_SSID],
    password: wifiEnvs[params.WIFI_KEY_PASSWORD]
  };
}

// Utils

/**
 * Get last log from wifi container
 * Contains useful information for the user, check echos before exit codes:
 * https://github.com/dappnode/DNP_WIFI/blob/master/build/wlanstart.sh
 */
async function getWifiLastLog(): Promise<string> {
  return await logContainer(params.wifiContainerName, {
    stderr: true,
    tail: 1
  });
}

function parseWifiLogs(lastLog: string): string {
  return lastLog.replace(/\[.*?\]/g, ""); // Remove [warning], [error], etc
}
