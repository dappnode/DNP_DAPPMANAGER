import upnpcCommand from "./upnpcCommand";
import parseListOutput from "./parseListOutput";
import { UpnpPortMapping } from "./types";
import { UpnpError } from "./upnpError";

/**
 * Lists current port mapping for DAppNode
 * Actual command:
 *   docker run --rm --net=host ${IMAGE} upnpc -l
 *
 * @returns port mappings = [
 *   {protocol: 'UDP', exPort: '500', inPort: '500'},
 *   {protocol: 'UDP', exPort: '4500', inPort: '4500'},
 *   {protocol: 'UDP', exPort: '30303', inPort: '30303'},
 *   {protocol: 'TCP', exPort: '30303', inPort: '30303'},
 * ]
 */
export default async function list(): Promise<UpnpPortMapping[]> {
  const upnpListCommand = "-l";
  try {
    const res = await upnpcCommand(upnpListCommand);
    return parseListOutput(res);
  } catch (e) {
    throw new UpnpError({
      terminalOutput: e.message,
      command: upnpListCommand
    });
  }
}
