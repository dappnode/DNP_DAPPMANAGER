import express from "express";
import {
  listContainers,
  listContainerNoThrow
} from "../../modules/docker/listContainers";
import { PackageContainer } from "../../types";

/**
 * Query publicly available packages data
 */
export const publicPackagesData: express.Handler = async (req, res) => {
  const id = req.params.id as string | undefined;

  if (id) {
    const privateDnpData = await listContainerNoThrow({ containerName: id });
    if (privateDnpData) {
      res.status(200).send(getPublicPackageData(privateDnpData));
    } else {
      res.status(404).send();
    }
  } else {
    const privateDnpData = await listContainers();
    res.status(200).send(privateDnpData.map(getPublicPackageData));
  }
};

/**
 * Return only non-sensitive data
 */
function getPublicPackageData(
  container: PackageContainer
): {
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
