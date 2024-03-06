import { listPackages } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";

const coreName = params.coreDnpName;

/**
 * If core was installed returns its version in string, else an empty string
 */
export async function getCoreVersion(): Promise<string> {
  const dnpList = await listPackages();
  const coreDnp = dnpList.find(_dnp => _dnp.dnpName === coreName);

  return coreDnp ? coreDnp.version : "";
}
