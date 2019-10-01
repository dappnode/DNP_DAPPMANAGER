import { RpcHandlerReturn } from "../types";
import * as db from "../db";

interface RpcGetParamsReturn extends RpcHandlerReturn {
  result: {
    ip: string; // "85.84.83.82",
    name: string; // "My-DAppNode",
    staticIp: string; // "85.84.83.82" | null,
    domain: string; // "1234acbd.dyndns.io",
    upnpAvailable: boolean;
    noNatLoopback: boolean;
    alertToOpenPorts: boolean;
    internalIp: string; // "192.168.0.1",
  };
}

/**
 * Returns the current DAppNode identity
 *
 * @returns = {
 *   ip: "85.84.83.82",
 *   name: "My-DAppNode",
 *   staticIp: "85.84.83.82" | null,
 *   domain: "1234acbd.dyndns.io",
 *   upnpAvailable: true | false,
 *   noNatLoopback: true | false,
 *   alertToOpenPorts: true | false,
 *   internalIp: 192.168.0.1,
 * }
 */
export default async function getParams(): Promise<RpcGetParamsReturn> {
  return {
    message: "Got params",
    result: {
      ip: db.publicIp.get(),
      name: db.serverName.get(),
      staticIp: db.staticIp.get(),
      domain: db.domain.get(),
      upnpAvailable: db.upnpAvailable.get(),
      noNatLoopback: db.noNatLoopback.get(),
      alertToOpenPorts: db.alertToOpenPorts.get(),
      internalIp: db.internalIp.get()
    }
  };
}

module.exports = getParams;
