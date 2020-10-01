import upnpcCommand from "./upnpcCommand";
import parseListOutput from "./parseListOutput";
import parseGeneralErrors from "./parseGeneralErrors";
import { UpnpPortMapping } from "./types";

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
  try {
    const res = await upnpcCommand(`-l`);
    return parseListOutput(res);
  } catch (e) {
    parseGeneralErrors(e.message);
    throw e;
  }
}
