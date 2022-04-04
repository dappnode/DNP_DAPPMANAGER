import { DirectoryItemOk, DirectoryItem } from "../../common";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";
import { mockPublicDnps } from "./publicDnps";

export const registries: Record<string, DirectoryItem[]> = {
  "dnp.dappnode": [
    ...mockDnps.map(getDirectoryDnp),
    {
      index: 99,
      status: "error",
      dnpName: "fetch-fails.dnp.dappnode.eth",
      whitelisted: true,
      isFeatured: false,
      isVerified: false,
      message: "Sample error: Can't download manifest"
    }
  ],

  "public.dappnode": [
    ...mockPublicDnps,
    {
      index: 99,
      status: "error",
      dnpName: "fetch-fails.public.dappnode.eth",
      whitelisted: true,
      isFeatured: false,
      isVerified: false,
      message: "Sample error: Can't download manifest"
    }
  ]
};

function getDirectoryDnp(dnp: MockDnp, index: number): DirectoryItemOk {
  return {
    index,
    status: "ok",
    dnpName: dnp.metadata.name,
    description:
      dnp.metadata.shortDescription || dnp.metadata.description || "",
    avatarUrl: dnp.avatar || "",
    isFeatured: false,
    isInstalled: Boolean(dnp.installedData),
    isUpdated: false,
    isVerified: false,
    whitelisted: true,
    featuredStyle: dnp.metadata.style,
    categories: dnp.metadata.categories || []
  };
}
