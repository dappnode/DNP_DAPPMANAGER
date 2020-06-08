import { DiagnoseResult } from "../types";
import { HostStats, PackageContainer, SystemInfo } from "common/types";

type DiagnoseResultOrNull = DiagnoseResult | null;

/**
 * Diagnose texts
 * ==============
 *
 * Must return an object as:
 *
 * {
 *   ok: {Boolean},
 *   msg: {string} (short description),
 *   solutions: {array}
 * }
 *
 * can also return null, and that diagnose will be ignored
 */

export function connection({
  isOpen,
  error
}: {
  isOpen: boolean;
  error: string | null;
}): DiagnoseResultOrNull {
  return {
    ok: isOpen,
    msg: isOpen ? "Session is open" : `Session is closed: ${error || ""}`,
    solutions: [
      `You may be disconnected from your DAppNode's VPN. Please make sure your connection is still active`,
      `If you are still connected, disconnect your VPN connection, connect again and refresh this page`
    ]
  };
}

export function openPorts({
  data: dappnodeParams,
  isValidating
}: {
  data?: SystemInfo;
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating) return { loading: true, msg: "Loading system info..." };
  if (!dappnodeParams) return null;
  const { alertToOpenPorts } = dappnodeParams;
  return {
    ok: !alertToOpenPorts,
    msg: alertToOpenPorts
      ? "Ports have to be opened and there is no UPnP device available"
      : "No ports have to be opened OR the router has UPnP enabled",
    solutions: [
      "If you are capable of opening ports manually, please ignore this error",
      "Your router may have UPnP but it is not turned on yet. Please research if your specific router has UPnP and turn it on"
    ]
  };
}

export function noNatLoopback({
  data: dappnodeParams,
  isValidating
}: {
  data?: SystemInfo;
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating) return { loading: true, msg: "Loading system info..." };
  if (!dappnodeParams) return null;
  const { noNatLoopback, internalIp } = dappnodeParams;
  return {
    ok: !noNatLoopback,
    msg: noNatLoopback
      ? "No NAT loopback, external IP did not resolve"
      : "NAT loopback enabled, external IP resolves",
    solutions: [
      `Please use the internal IP: ${internalIp} when you are in the same network as your DAppNode`
    ]
  };
}

export function ipfs({
  data: ipfsConnectionStatus,
  isValidating
}: {
  data?: { resolves: boolean; error?: string };
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating)
    return { loading: true, msg: "Checking if IPFS resolves..." };
  if (!ipfsConnectionStatus) return null;
  return {
    ok: ipfsConnectionStatus.resolves,
    msg: ipfsConnectionStatus.resolves
      ? "IPFS resolves"
      : "IPFS is not resolving: " + ipfsConnectionStatus.error,
    solutions: [
      `Go to the system tab and make sure IPFS is running. Otherwise open the package and click 'restart'`,
      `If the problem persist make sure your disk has not run of space; IPFS may malfunction in that case.`
    ]
  };
}

export function diskSpace({
  data,
  isValidating
}: {
  data?: HostStats;
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating) return { loading: true, msg: "Checking disk usage..." };
  if (!data || !data.disk) return null;
  const ok = parseInt(data.disk) < 95;
  return {
    ok,
    msg: ok ? "Disk usage is ok (<95%)" : "Disk usage is over 95%",
    solutions: [
      "If the disk usage gets to 100%, DAppNode will stop working. Please empty some disk space",
      "Locate DAppNode Packages with big volumes such as blockchain nodes and remove their data"
    ]
  };
}

export function coreDnpsRunning({
  data: dnpInstalled,
  isValidating
}: {
  data?: PackageContainer[];
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating)
    return {
      loading: true,
      msg: "Verifying installed core DAppNode Packages..."
    };

  if (!dnpInstalled) return null;

  const mandatoryCoreDnps = [
    "dappmanager.dnp.dappnode.eth",
    "vpn.dnp.dappnode.eth",
    "admin.dnp.dappnode.eth",
    "ipfs.dnp.dappnode.eth",
    "wamp.dnp.dappnode.eth",
    "bind.dnp.dappnode.eth"
  ];
  const notFound = [];
  const notRunning = [];
  for (const coreDnpName of mandatoryCoreDnps) {
    const coreDnp = dnpInstalled.find(({ name }) => name === coreDnpName);
    if (!coreDnp) notFound.push(coreDnpName);
    else if (!coreDnp.running) notRunning.push(coreDnpName);
  }

  const ok = !notFound.length && !notRunning.length;
  let errorMsg = "";
  if (!ok && notFound.length)
    errorMsg += `Core DAppNode Packages ${notFound.join(", ")} are not found. `;
  if (!ok && notRunning.length)
    errorMsg += `Core DAppNode Packages ${notFound.join(
      ", "
    )} are not running.`;
  return {
    ok,
    msg: ok ? "All core DAppNode Packages are running" : errorMsg,
    solutions: [
      "Make sure the disk is not too full. If so DAppNode automatically stops the IPFS package to prevent it from becoming un-usable",
      "Go to the System tab and restart each stopped DAppNode Package. Please inspect the logs to understand cause and report it if it was not expected"
    ]
  };
}
