import { PackagePort, TcpPortScan, ApiStatus } from "../../common";

/**
 * API
 * 1.API available AND port open => "open"
 * 2.API available AND port closed => "closed"
 * 3.API available AND port error => "error"
 * 4.API not available OR port not found => "unknown"
 */
export function getApiStatus({
  port,
  apiTcpPortsStatus
}: {
  port: PackagePort;
  apiTcpPortsStatus: TcpPortScan[];
}): ApiStatus {
  return (
    apiTcpPortsStatus.find(apiPort => apiPort.port === port.portNumber)
      ?.status || "unknown"
  );
}
