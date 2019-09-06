import upnpcCommand from "./upnpcCommand";
import parseCloseOutput from "./parseCloseOutput";
import { PackagePort } from "../../types";

/**
 * Close port = deletes the map requested port to host
 * Actual command example:
 *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 500 UDP
 *
 * @param {object} kwargs: {
 *   portNumber: '3000',
 *   protocol: 'TCP',
 * }
 * @returns {*}
 */
export default async function close(port: PackagePort): Promise<boolean> {
  const { portNumber, protocol } = port;

  try {
    const res = await upnpcCommand(`-e DAppNode -d ${portNumber} ${protocol}`);
    return parseCloseOutput(res);
  } catch (e) {
    parseCloseOutput(e.message);
    throw e;
  }
}
