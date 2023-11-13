import { PackageItemData, PackageRelease } from "@dappnode/common";
import { ReleaseFetcher } from "../release/index.js";
import * as db from "@dappnode/db";
import { pick } from "lodash-es";
import { Manifest } from "@dappnode/types";
import { eventBus } from "@dappnode/eventbus";

// TODO: find a proper place for these functions. The functions inside this file
// are not used as the other files within this same folder

export async function packageGetData(
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
    const dataDnp = packagePickItemData(repository);
    db.pkgItemMetadata.set(dnpName, dataDnp);
    return dataDnp;
  }
}

export function packagePickItemData(
  pkgRelease: PackageRelease
): PackageItemData {
  return {
    metadata: packagePickManifestData(pkgRelease.metadata),
    ...pick(pkgRelease, [
      "dnpName",
      "reqVersion",
      "semVersion",
      "imageFile",
      "avatarFile",
      "warnings",
      "origin",
      "signedSafe",
    ] as const),
  };
}

function packagePickManifestData(manifest: Manifest): Manifest {
  return pick(manifest, [
    "name",
    "version",
    "shortDescription",
    "avatar",
    "links",
    "chain",
    "warnings",
  ] as const);
}
