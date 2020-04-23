
/**
 * Open or closes requested ports
 * [DEPRECATED]
 * [NOTE]: Ports will be open and close automatically by the NatRenewal
 * watcher, no need to manually call this function
 *
 * @param {string} action: "open" or "close" (string)
 * @param {array} ports: array of port objects
 * ports = [ { portNumber: 30303, protocol: TCP }, ... ]
 */
export default async function managePorts(): Promise<void> {
  throw Error("deprecated");
}
