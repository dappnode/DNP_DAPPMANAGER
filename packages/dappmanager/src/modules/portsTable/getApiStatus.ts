import { PackagePort, TcpPortScan, ApiStatus } from "../../common";

/**
 * API
 * 1.API available AND port open => "open"
 * 2.API available AND port closed => "closed"
 * 3.API available AND port error OR API not available => "error"
 * 4.port not found => "unknown"
 */
export function getApiStatus({
  port,
  apiTcpPortsStatus
}: {
  port: PackagePort;
  apiTcpPortsStatus?: TcpPortScan[];
}): ApiStatus {
  if (!apiTcpPortsStatus) return { status: "not-fetched" };
  const tcpPortStatus = apiTcpPortsStatus.find(
    apiPort => apiPort.port === port.portNumber
  );
  return {
    status: tcpPortStatus?.status || "unknown",
    message: tcpPortStatus?.message
  };
}
