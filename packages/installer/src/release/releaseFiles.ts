import { FileFormat } from "@dappnode/common";

/**
 * Plain text file with should contain the IPFS hash of the release
 * Necessary for the installer script to fetch the latest content hash
 * of the eth clients. The resulting hashes are used by the DAPPMANAGER
 * to install an eth client when the user does not want to use a remote node
 *
 * /ipfs/QmNqDvqAyy3pN3PvymB6chM7S1FgYyive8LosVKUuaDdfd
 */
export const contentHashFile = "content-hash" as const;

export const releaseFiles = Object.freeze({
  manifest: Object.freeze({
    regex: /dappnode_package.*\.(json|yaml|yml)$/,
    format: FileFormat.YAML,
    maxSize: 100e3, // Limit size to ~100KB
    required: true as const,
    multiple: false as const,
  }),
  compose: Object.freeze({
    regex: /compose.*\.yml$/,
    format: FileFormat.YAML,
    maxSize: 10e3, // Limit size to ~10KB
    required: true as const,
    multiple: false as const,
  }),
  signature: Object.freeze({
    regex: /^signature\.json$/,
    format: FileFormat.JSON,
    maxSize: 10e3, // Limit size to ~10KB
    required: false as const,
    multiple: false as const,
  }),
  avatar: Object.freeze({
    regex: /avatar.*\.png$/,
    format: null,
    maxSize: 100e3,
    required: true as const,
    multiple: false as const,
  }),
  setupWizard: Object.freeze({
    regex: /setup-wizard\..*(json|yaml|yml)$/,
    format: FileFormat.YAML,
    maxSize: 100e3,
    required: false as const,
    multiple: false as const,
  }),
  setupSchema: Object.freeze({
    regex: /setup\..*\.json$/,
    format: FileFormat.JSON,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const,
  }),
  setupTarget: Object.freeze({
    regex: /setup-target\..*json$/,
    format: FileFormat.JSON,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const,
  }),
  setupUiJson: Object.freeze({
    regex: /setup-ui\..*json$/,
    format: FileFormat.JSON,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const,
  }),
  disclaimer: Object.freeze({
    regex: /disclaimer\.md$/i,
    format: FileFormat.TEXT,
    maxSize: 100e3,
    required: false as const,
    multiple: false as const,
  }),
  gettingStarted: Object.freeze({
    regex: /getting.*started\.md$/i,
    format: FileFormat.TEXT,
    maxSize: 100e3,
    required: false as const,
    multiple: false as const,
  }),
  prometheusTargets: Object.freeze({
    regex: /.*prometheus-targets.(json|yaml|yml)$/,
    format: FileFormat.YAML,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const,
  }),
  grafanaDashboards: Object.freeze({
    regex: /.*grafana-dashboard.json$/,
    format: FileFormat.JSON,
    maxSize: 10e6, // ~ 10MB
    required: false as const,
    multiple: true as const,
  }),
} as const);

export const releaseFilesToDownload = Object.freeze({
  manifest: releaseFiles.manifest,
  compose: releaseFiles.compose,
  signature: releaseFiles.signature,
  disclaimer: releaseFiles.disclaimer,
  gettingStarted: releaseFiles.gettingStarted,
  prometheusTargets: releaseFiles.prometheusTargets,
  grafanaDashboards: releaseFiles.grafanaDashboards,
} as const);

export const releaseFilesDefaultNames: {
  [P in keyof typeof releaseFiles]: string;
} = Object.freeze({
  manifest: "dappnode_package.json",
  compose: "docker-compose.yml",
  avatar: "avatar.png",
  signature: "signature.json",
  setupWizard: "setup-wizard.json",
  setupSchema: "setup.schema.json",
  setupTarget: "setup-target.json",
  setupUiJson: "setup-ui.json",
  disclaimer: "disclaimer.md",
  gettingStarted: "getting-started.md",
  grafanaDashboards: "grafana-dashboard.json",
  prometheusTargets: "prometheus-targets.json",
} as const);
