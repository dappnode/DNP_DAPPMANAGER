import fetch from "node-fetch";
import { parseRpcResponse } from "../common";
import params from "../params";

/**
 * Call a VPN RPC JSON API route
 * @param route "addDevice"
 * @param args [ { id: "name" } ]
 */
export async function vpnRpcCall<R>(route: string, ...args: any[]): Promise<R> {
  const res = await fetch(params.vpnApiRpcUrl, {
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
