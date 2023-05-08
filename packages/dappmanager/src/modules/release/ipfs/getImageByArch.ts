import { NodeArch } from "../../../types.js";
import {
  Manifest,
  Architecture,
  defaultArch,
  getImagePath,
  getLegacyImagePath
} from "@dappnode/types";
import { NoImageForArchError } from "../errors.js";
import { IPFSEntryName } from "../types.js";

export function getImageByArch<T extends IPFSEntryName>(
  manifest: Manifest,
  files: T[],
  nodeArch: NodeArch
): T {
  const arch = parseNodeArch(nodeArch);
  const { name, version } = manifest;
  const imageAsset =
    files.find(file => file.name === getImagePath(name, version, arch)) ||
    (arch === defaultArch
      ? // New DAppNodes should load old single arch packages,
        // and consider their single image as amd64
        files.find(file => file.name === getLegacyImagePath(name, version))
      : undefined);

  if (!imageAsset) {
    throw new NoImageForArchError(
      nodeArch,
      // Add message if image should have had this arch available
      manifest.architectures && manifest.architectures.includes(arch)
        ? `image for ${arch} is missing in release`
        : undefined
    );
  } else {
    return imageAsset;
  }
}

function parseNodeArch(nodeArch: NodeArch): Architecture {
  switch (nodeArch) {
    case "arm":
    case "arm64":
      return "linux/arm64";

    case "x64":
      return "linux/amd64";

    default:
      return defaultArch;
  }
}
