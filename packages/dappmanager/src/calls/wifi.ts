import { ComposeFileEditor } from "../modules/compose/editor";
import { logContainer } from "../modules/docker/api";
import { listContainer } from "../modules/docker/list";
import { CurrentWifiCredentials, WifiReport } from "../types";
import params from "../params";

const WIFI_KEY_SSID = "SSID";
const WIFI_KEY_PASSWORD = "WPA_PASSPHRASE";

/**
 * Return wifi report
 */
export async function wifiReportGet(): Promise<WifiReport> {
  const wifiDnp = await listContainer({
    containerName: params.wifiContainerName
  });
  if (!wifiDnp)
    throw Error(
      `Wifi is not present. Container name: ${params.wifiContainerName}`
    );

  let report;
  let info = "";

  switch (wifiDnp.state) {
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
        exitCode: wifiDnp.exitCode
      };
    case "exited":
      info = "Wifi service exited due to an internal error";
      report = {
        lastLog: parseWifiLogs(await getWifiLastLog()),
        exitCode: wifiDnp.exitCode
      };
    case "paused":
      info = "Wifi service is paused. Restart wifi to get back access again";
  }

  return {
    containerState: wifiDnp.state,
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
    typeof wifiEnvs[WIFI_KEY_SSID] === "undefined" ||
    typeof wifiEnvs[WIFI_KEY_PASSWORD] === "undefined"
  )
    throw Error(
      "Wifi SSID and/or Wifi password does not exist on compose file"
    );
  return {
    ssid: wifiEnvs[WIFI_KEY_SSID],
    password: wifiEnvs[WIFI_KEY_PASSWORD]
  };
}

// Utils

/**
 * Get last log from wifi container
 * Contains useful information for the user, check echos before exit codes:
 * https://github.com/dappnode/DNP_WIFI/blob/master/build/wlanstart.sh
 */
async function getWifiLastLog(): Promise<string> {
  return await logContainer(params.wifiContainerName, { stderr: true });
}

function parseWifiLogs(lastLog: string): string {
  // There are three exit logs defined in the wifi container
  // https://github.com/dappnode/DNP_WIFI/blob/00685cf6160df4b8daeabd77246cb0af04a513f8/build/wlanstart.sh#L5
  // https://github.com/dappnode/DNP_WIFI/blob/00685cf6160df4b8daeabd77246cb0af04a513f8/build/wlanstart.sh#L34
  // https://github.com/dappnode/DNP_WIFI/blob/00685cf6160df4b8daeabd77246cb0af04a513f8/build/wlanstart.sh#L52
  return lastLog.replace(/\[.*?\]/g, ""); // Replace [warning], [error], etc
}
