import { DirectoryItem } from "../../common";
import { mockPublicDnps } from "./publicDnps";

export const registry: DirectoryItem[] = [
  ...mockPublicDnps,
  {
    index: 99,
    status: "error",
    dnpName: "fetch-fails.public.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message: "Sample error: Can't download manifest"
  }
];
