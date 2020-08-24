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
  name: string,
  version: string,
  arch: Architecture
): string => `${name}_${version}_${getArchTag(arch)}.txz`;
export const getLegacyImagePath = (name: string, version: string): string =>
  `${name}_${version}.tar.xz`;
