import { PackageItemData, PackageRelease } from "@dappnode/common";
import { eventBus } from "../eventBus.js";
import { ReleaseFetcher } from "../modules/release/index.js";
import * as db from "../db/index.js";
import { pick } from "lodash-es";
import { Manifest } from "@dappnode/types";

export async function getPkgData(
  releaseFetcher: ReleaseFetcher,
  dnpName: string
): Promise<PackageItemData> {
  const cachedDnp = db.pkgItemMetadata.get(dnpName);
  if (cachedDnp) {
    // Update cache in the background
    eventBus.runStakerCacheUpdate.emit({ dnpName });
    return cachedDnp;
  } else {
    const repository = await releaseFetcher.getRelease(dnpName);
    const dataDnp = pickPackageItemData(repository);
    db.pkgItemMetadata.set(dnpName, dataDnp);
    return dataDnp;
  }
}

export function pickPackageItemData(
  pkgRelease: PackageRelease
): PackageItemData {
  return {
    metadata: pickPackageManifestData(pkgRelease.metadata),
    ...pick(pkgRelease, [
      "dnpName",
      "reqVersion",
      "semVersion",
      "imageFile",
      "avatarFile",
      "warnings",
      "origin",
      "signedSafe"
    ] as const)
  };
}

function pickPackageManifestData(manifest: Manifest): Manifest {
  return pick(manifest, [
    "name",
    "version",
    "shortDescription",
    "avatar",
    "links",
    "chain",
    "warnings"
  ] as const);
}
