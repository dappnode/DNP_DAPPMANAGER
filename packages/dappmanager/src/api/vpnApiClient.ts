import fetch from "node-fetch";
import { mapValues } from "lodash";
import { parseRpcResponse } from "../common";
import { PackageVersionData } from "../types";

export interface VpnApiClient {
  addDevice: (kwargs: { id: string }) => Promise<void>;
  toggleAdmin: (kwargs: { id: string; isAdmin: boolean }) => Promise<void>;
  removeDevice: (kwargs: { id: string }) => Promise<void>;
  resetDevice: (kwargs: { id: string }) => Promise<void>;
  listDevices: () => Promise<{ id: string; admin: boolean; ip: string }[]>;
  getDeviceCredentials: (kwargs: {
    id: string;
  }) => Promise<{ filename: string; key: string; url: string }>;
  getVersionData: () => Promise<PackageVersionData>;
}

const vpnApiRoutesData: { [P in keyof VpnApiClient]: true } = {
  addDevice: true,
  toggleAdmin: true,
  removeDevice: true,
  resetDevice: true,
  listDevices: true,
  getDeviceCredentials: true,
  getVersionData: true
};

export interface VpnApiClientParams {
  VPN_API_RPC_URL: string;
}

type Args = any[];

export function getVpnApiClient(params: VpnApiClientParams): VpnApiClient {
  return mapValues(vpnApiRoutesData, (data, route) => (...args: Args): any =>
    vpnRpcCall(params, route, ...args)
  );
}

/**
 * Call a VPN RPC JSON API route
 * @param route "addDevice"
 * @param args [ { id: "name" } ]
 */
async function vpnRpcCall<R>(
  params: VpnApiClientParams,
  route: string,
  ...args: Args
): Promise<R> {
  const res = await fetch(params.VPN_API_RPC_URL, {
    method: "post",
    body: JSON.stringify({ method: route, params: args }),
    headers: { "Content-Type": "application/json" }
  });

  // If body is not JSON log it to get info about the error. Express may respond with HTML
  const bodyText = await res.text();
  let body: any;
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    throw Error(
      `Error parsing JSON body (${res.status} ${res.statusText}): ${e.message}\n${bodyText}`
    );
  }

  if (!res.ok)
    throw Error(`${res.status} ${res.statusText} ${body.message || ""}`);

  // RPC response are always code 200
  return parseRpcResponse<R>(body);
}
