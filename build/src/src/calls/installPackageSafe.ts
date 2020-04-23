import installPackage from "./installPackage";
import * as parse from "../utils/parse";

/**
 * Installs a package in safe mode, by setting options.BYPASS_RESOLVER = true
 *
 * @param {string} id DNP .eth name
 * @param {object} options install options
 * - BYPASS_CORE_RESTRICTION: Allows dncore DNPs from unverified sources (IPFS)
 * options = { BYPASS_CORE_RESTRICTION: true }
 */
export default async function installPackageSafe({
  id,
  options = {}
}: {
  id: string;
  options?: { BYPASS_RESOLVER?: boolean };
}): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");
  const { name, ver: version } = parse.packageReq(id);

  return await installPackage({
    name,
    version,
    userSettings: {},
    options: {
      ...options,
      BYPASS_RESOLVER: true
    }
  });
}
