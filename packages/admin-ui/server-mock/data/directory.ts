import { DirectoryItemOk, DirectoryItem } from "../../src/common";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";

function getDirectoryDnp(dnp: MockDnp): DirectoryItemOk {
  return {
    status: "ok",
    name: dnp.metadata.name,
    description:
      dnp.metadata.shortDescription || dnp.metadata.description || "",
    avatarUrl: dnp.avatar || "",
    isFeatured: false,
    isInstalled: Boolean(dnp.installedData),
    isUpdated: false,
    whitelisted: true,
    featuredStyle: dnp.metadata.style,
    categories: dnp.metadata.categories || []
  };
}

export const directory: DirectoryItem[] = [
  ...mockDnps.map(getDirectoryDnp),

  {
    status: "loading",
    name: "fetch-loads.dnp.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message:
      "Loading manifest and more stuff really long text that goes on and on and more stuff 57%"
  },
  {
    status: "error",
    name: "fetch-fails.dnp.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message: "Sample error: Can't download manifest"
  }
];
