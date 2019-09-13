import getDependencies from "../../release/getDependencies";
import { Dependencies } from "../../../types";

/**
 * Fetches the dependencies of a given DNP name and version
 *
 * @param {object} kwargs: {
 *   name: Name of package i.e. "kovan.dnp.dappnode.eth"
 *   version: version requested i.e. "0.1.0" or "/ipfs/Qmre4..."
 * }
 * @returns {object} dependencies:
 *   { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
 */
export default async function fetchDependencies(
  name: string,
  version: string
): Promise<Dependencies> {
  return await getDependencies(name, version);
}
