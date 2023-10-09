import {
  listPackageContainers,
  listPackageContainerNoThrow
} from "@dappnode/dockerapi";
import { PackageContainer } from "@dappnode/common";
import { wrapHandler } from "../utils.js";

interface Params {
  containerName: string;
}

/**
 * Query publicly available packages data
 */
export const publicPackagesData = wrapHandler<Params>(async (req, res) => {
  const { containerName } = req.params;

  if (containerName) {
    const privateDnpData = await listPackageContainerNoThrow({ containerName });
    if (privateDnpData) {
      res.status(200).send(getPublicPackageData(privateDnpData));
    } else {
      res.status(404).send();
    }
  } else {
    const privateDnpData = await listPackageContainers();
    res.status(200).send(privateDnpData.map(getPublicPackageData));
  }
});

/**
 * Return only non-sensitive data
 */
function getPublicPackageData(container: PackageContainer): {
  name: string;
  version: string;
  state: string;
  ip?: string;
} {
  return {
    name: container.dnpName,
    version: container.version,
    state: container.state,
    ip: container.ip
  };
}
