// Default ports to open in case getPortsToOpen throws
const defaultPortsToOpen = [
  // - OpenVPN: 1194 UDP
  { protocol: "UDP", portNumber: 1194 },
  // - SSH: 22 TCP (Ignore)
  // {protocol: 'TCP', portNumber: 22},
  // - Alt HTTP: 8080 TCP
  { protocol: "TCP", portNumber: 8090 },
  // - ETH: 30303 TCP, 30303 UDP
  { protocol: "TCP", portNumber: 30303 },
  { protocol: "UDP", portNumber: 30303 },
  // - IPFS: 4001 TCP, 4002 UDP
  { protocol: "TCP", portNumber: 4001 },
  { protocol: "UDP", portNumber: 4002 }
];

module.exports = defaultPortsToOpen;
