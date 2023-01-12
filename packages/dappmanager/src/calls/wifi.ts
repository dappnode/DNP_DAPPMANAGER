import { ComposeFileEditor } from "../modules/compose/editor";
import { logContainer } from "../modules/docker/api";
import { listContainer } from "../modules/docker/list";
import { CurrentWifiCredentials, WifiReport } from "@dappnode/common";
import params from "../params";

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
    case "running":
      info = "Wifi is currently running";
    case "restarting":
      info = "Wifi restarting. Wait until it starts";
    case "dead":
      info =
        "Wifi service dead, you must manually remove it and install it again";
      report = {
        lastLog: parseWifiLogs(await getWifiLastLog()),
        exitCode: wifiContainer.exitCode
      };
    case "exited":
      info = "Wifi service exited due to an internal error";
      report = {
        lastLog: parseWifiLogs(await getWifiLastLog()),
        exitCode: wifiContainer.exitCode
      };
    case "paused":
      info = "Wifi service is paused. Restart wifi to get back access again";
  }

  return {
    info,
    report
  };
}

/**
 * Returns wifi credentials
 */
export async function wifiCredentialsGet(): Promise<CurrentWifiCredentials> {
  const composeWifi = new ComposeFileEditor(params.wifiDnpName, true);
  const wifiService = composeWifi.services()[params.wifiDnpName];
  const wifiEnvs = wifiService.getEnvs();
  if (
    wifiEnvs[params.WIFI_KEY_SSID] === undefined ||
    wifiEnvs[params.WIFI_KEY_PASSWORD] === undefined
  )
    throw Error(
      "Wifi SSID and/or Wifi password does not exist on compose file"
    );
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
