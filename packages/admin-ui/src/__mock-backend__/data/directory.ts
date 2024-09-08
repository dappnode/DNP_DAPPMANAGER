import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";
import { DirectoryItem, DirectoryItemOk } from "@dappnode/types";

function getDirectoryDnp(dnp: MockDnp, index: number): DirectoryItemOk {
  return {
    index,
    status: "ok",
    name: dnp.manifest.name,
    description: dnp.manifest.shortDescription || dnp.manifest.description || "",
    avatarUrl: dnp.avatar || "",
    isFeatured: false,
    isInstalled: Boolean(dnp.installedData),
    isUpdated: false,
    whitelisted: true,
    featuredStyle: dnp.manifest.style,
    categories: dnp.manifest.categories || []
  };
}

export const directory: DirectoryItem[] = [
  ...mockDnps.map(getDirectoryDnp),
  {
    index: 99,
    status: "error",
    name: "fetch-fails.dnp.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message: "Sample error: Can't download manifest"
  }
];
