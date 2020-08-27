import { Architecture } from "../../types";

export const releaseFilesRegex = {
  manifest: /dappnode_package.*\.json$/,
  compose: /compose.*\.yml$/,
  avatar: /avatar.*\.png$/,
  setupWizard: /setup-wizard\..*(json|yaml|yml)$/,
  setupSchema: /setup\..*\.json$/,
  setupTarget: /setup-target\..*json$/,
  setupUiJson: /setup-ui\..*json$/,
  disclaimer: /disclaimer\.md$/i,
  gettingStarted: /getting.*started\.md$/i
};

// Single arch images
export const getArchTag = (arch: Architecture): string =>
  arch.replace(/\//g, "-");
export const getImagePath = (
  dnpName: string,
  version: string,
  arch: Architecture
): string => `${dnpName}_${version}_${getArchTag(arch)}.txz`;
export const getLegacyImagePath = (dnpName: string, version: string): string =>
  `${dnpName}_${version}.tar.xz`;
