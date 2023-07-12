import { DirectoryItem } from "@dappnode/common";
import { mockPublicDnps } from "./publicDnps";

export const registry: DirectoryItem[] = [
  ...mockPublicDnps,
  {
    index: 99,
    status: "error",
    name: "fetch-fails.public.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message: "Sample error: Can't download manifest"
  }
];
