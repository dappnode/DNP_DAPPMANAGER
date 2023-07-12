import { PackagePort, PortProtocol } from "@dappnode/common";

// Default ports to open in case getPortsToOpen throws
const defaultPortsToOpen: PackagePort[] = [
  // - OpenVPN: 1194 UDP
  { protocol: PortProtocol.UDP, portNumber: 1194 },
  // - SSH: 22 TCP (Ignore)
  // {protocol: 'TCP', portNumber: 22},
  // - Alt HTTP: 8080 TCP
  { protocol: PortProtocol.TCP, portNumber: 8090 },
  // - ETH: 30303 TCP, 30303 UDP
  { protocol: PortProtocol.TCP, portNumber: 30303 },
  { protocol: PortProtocol.UDP, portNumber: 30303 },
  // - IPFS: 4001 TCP, 4002 UDP
  { protocol: PortProtocol.TCP, portNumber: 4001 },
  { protocol: PortProtocol.UDP, portNumber: 4002 }
];

export default defaultPortsToOpen;
