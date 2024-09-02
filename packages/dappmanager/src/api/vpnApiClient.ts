import { mapValues } from "lodash-es";
import { parseRpcResponse } from "@dappnode/common";
import { PackageVersionData, RpcResponse } from "@dappnode/types";

export interface VpnApiClient {
  addDevice: (kwargs: { id: string }) => Promise<void>;
  removeDevice: (kwargs: { id: string }) => Promise<void>;
  resetDevice: (kwargs: { id: string }) => Promise<void>;
  listDevices: () => Promise<{ id: string }[]>;
  getDeviceCredentials: (kwargs: { id: string }) => Promise<{ filename: string; key: string; url: string }>;
  getVersionData: () => Promise<PackageVersionData>;
}

const vpnApiRoutesData: { [P in keyof VpnApiClient]: true } = {
  addDevice: true,
  removeDevice: true,
  resetDevice: true,
  listDevices: true,
  getDeviceCredentials: true,
  getVersionData: true
};

export interface VpnApiClientParams {
  VPN_API_RPC_URL: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = any[];

export function getVpnApiClient(params: VpnApiClientParams): VpnApiClient {
  return mapValues(
    vpnApiRoutesData,
    (_, route) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: Args): any =>
        vpnRpcCall(params, route, ...args)
  );
}

/**
 * Call a VPN RPC JSON API route
 * @param route "addDevice"
 * @param args [ { id: "name" } ]
 */
async function vpnRpcCall<R>(params: VpnApiClientParams, route: string, ...args: Args): Promise<R> {
  const res = await fetch(params.VPN_API_RPC_URL, {
    method: "post",
    body: JSON.stringify({ method: route, params: args }),
    headers: { "Content-Type": "application/json" }
  });

  // If body is not JSON log it to get info about the error. Express may respond with HTML
  const bodyText = await res.text();
  let body: RpcResponse<R>;
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    throw Error(`Error parsing JSON body (${res.status} ${res.statusText}): ${e.message}\n${bodyText}`);
  }

  if (!res.ok) {
    const errorBody = body as unknown as Error;
    throw Error(`${res.status} ${res.statusText} ${errorBody.message || ""}`);
  }

  // RPC response are always code 200
  return parseRpcResponse<R>(body);
}
