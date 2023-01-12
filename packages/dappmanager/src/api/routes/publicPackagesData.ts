import {
  listContainers,
  listContainerNoThrow
} from "../../modules/docker/list";
import { PackageContainer } from "@dappnode/common";
import { wrapHandler } from "../utils";

interface Params {
  containerName: string;
}

/**
 * Query publicly available packages data
 */
export const publicPackagesData = wrapHandler<Params>(async (req, res) => {
  const { containerName } = req.params;

  if (containerName) {
    const privateDnpData = await listContainerNoThrow({ containerName });
    if (privateDnpData) {
      res.status(200).send(getPublicPackageData(privateDnpData));
    } else {
      res.status(404).send();
    }
  } else {
    const privateDnpData = await listContainers();
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
