import upnpcCommand from "./upnpcCommand";
import parseListOutput from "./parseListOutput";

/**
 * Lists current port mapping for DAppNode
 * Actual command:
 *   docker run --rm --net=host ${IMAGE} upnpc -l
 *
 * @returns {array} port mappings = [
 *   {protocol: 'UDP', exPort: '500', inPort: '500'},
 *   {protocol: 'UDP', exPort: '4500', inPort: '4500'},
 *   {protocol: 'UDP', exPort: '30303', inPort: '30303'},
 *   {protocol: 'TCP', exPort: '30303', inPort: '30303'},
 * ]
 */
export default async function list() {
  try {
    const res = await upnpcCommand(`-l`);
    return parseListOutput(res);
  } catch (e) {
    parseListOutput(e.message);
    throw e;
  }
}
