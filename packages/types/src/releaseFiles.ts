import { FileFormat } from "./pkg.js";

export const releaseFiles = Object.freeze({
  manifest: Object.freeze({
    regex: /dappnode_package.*\.(json|yaml|yml)$/,
    format: FileFormat.YAML,
    maxSize: 100e3, // Limit size to ~100KB
    required: true as const,
    multiple: false as const
  }),
  compose: Object.freeze({
    regex: /compose.*\.yml$/,
    format: FileFormat.YAML,
    maxSize: 10e3, // Limit size to ~10KB
    required: true as const,
    multiple: false as const
  }),
  signature: Object.freeze({
    regex: /^signature\.json$/,
    format: FileFormat.JSON,
    maxSize: 10e3, // Limit size to ~10KB
    required: false as const,
    multiple: false as const
  }),
  avatar: Object.freeze({
    regex: /avatar.*\.png$/,
    format: null,
    maxSize: 100e3,
    required: true as const,
    multiple: false as const
  }),
  setupWizard: Object.freeze({
    regex: /setup-wizard\..*(json|yaml|yml)$/,
    format: FileFormat.YAML,
    maxSize: 100e3,
    required: false as const,
    multiple: false as const
  }),
  setupSchema: Object.freeze({
    regex: /setup\..*\.json$/,
    format: FileFormat.JSON,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const
  }),
  setupTarget: Object.freeze({
    regex: /setup-target\..*json$/,
    format: FileFormat.JSON,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const
  }),
  setupUiJson: Object.freeze({
    regex: /setup-ui\..*json$/,
    format: FileFormat.JSON,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const
  }),
  disclaimer: Object.freeze({
    regex: /disclaimer\.md$/i,
    format: FileFormat.TEXT,
    maxSize: 100e3,
    required: false as const,
    multiple: false as const
  }),
  gettingStarted: Object.freeze({
    regex: /getting.*started\.md$/i,
    format: FileFormat.TEXT,
    maxSize: 100e3,
    required: false as const,
    multiple: false as const
  }),
  prometheusTargets: Object.freeze({
    regex: /.*prometheus-targets.(json|yaml|yml)$/,
    format: FileFormat.YAML,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const
  }),
  grafanaDashboards: Object.freeze({
    regex: /.*grafana-dashboard.json$/,
    format: FileFormat.JSON,
    maxSize: 10e6, // ~ 10MB
    required: false as const,
    multiple: true as const
  }),
  notifications: Object.freeze({
    regex: /^.*notifications\.yaml$/,
    format: FileFormat.YAML,
    maxSize: 10e3,
    required: false as const,
    multiple: false as const
  })
} as const);

export const releaseFilesToDownload = {
  manifest: releaseFiles.manifest,
  compose: releaseFiles.compose,
  signature: releaseFiles.signature,
  setupWizard: releaseFiles.setupWizard,
  disclaimer: releaseFiles.disclaimer,
  gettingStarted: releaseFiles.gettingStarted,
  prometheusTargets: releaseFiles.prometheusTargets,
  grafanaDashboards: releaseFiles.grafanaDashboards,
  notifications: releaseFiles.notifications
};
