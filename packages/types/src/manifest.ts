import {
  SetupSchema,
  SetupTarget,
  SetupUiJson,
  SetupWizard,
} from "./setupWizard.js";

export interface Manifest {
  // Package metadata
  name: string;
  version: string;
  upstreamVersion?: string;
  upstreamRepo?: string;
  upstreamArg?: string;
  upstream?: {
    repo: string;
    version: string;
    arg: string;
  }[];
  shortDescription?: string;
  description?: string;
  author?: string;
  license?: string;
  avatar?: string;
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  };
  categories?: string[];
  links?: {
    homepage?: string;
    ui?: string;
    api?: string;
    gateway?: string;
    [linkName: string]: string | undefined;
  };
  bugs?: {
    url: string;
  };
  keywords?: string[];
  contributors?: string[];

  // Docker instructions
  type?: "service" | "library" | "dncore";
  chain?: ChainDriver;
  mainService?: string;
  /** "15min" | 3600 */
  dockerTimeout?: string;
  dependencies?: Dependencies;
  optionalDependencies?: Dependencies;
  requirements?: {
    minimumDappnodeVersion?: string;
    minimumDockerVersion?: string;
  };
  globalEnvs?:
  | {
    all?: boolean;
  }
  | {
    envs: string[];
    services: string[];
  }[];
  architectures?: Architecture[];

  // Safety properties to solve problematic updates
  runOrder?: string[];
  restartCommand?: string;
  restartLaunchCommand?: string;

  // Install instructions
  changelog?: string;
  warnings?: {
    onInstall?: string;
    onPatchUpdate?: string;
    onMinorUpdate?: string;
    onMajorUpdate?: string;
    onReset?: string;
    onRemove?: string;
  };
  updateAlerts?: ManifestUpdateAlert[];
  disclaimer?: {
    message: string;
  };

  // Package features
  backup?: PackageBackup[];
  gettingStarted?: string;
  style?: {
    featuredBackground?: string;
    featuredColor?: string;
    featuredAvatarFilter?: string;
  };

  // Monitoring
  grafanaDashboards?: GrafanaDashboard[];
  prometheusTargets?: PrometheusTarget[];

  // Legacy setupWizardv1
  setupSchema?: SetupSchema;
  setupTarget?: SetupTarget;
  setupUiJson?: SetupUiJson;

  // Network metadata
  exposable?: ExposableServiceManifestInfo[];

  // setupWizard for compacted manifests in core packages
  setupWizard?: SetupWizard;
}

// Metrics
export interface GrafanaDashboard {
  uid?: string;
}

export interface PrometheusTarget {
  targets: string[];
  labels?: {
    job?: string;
    group?: string;
  };
}

// Update warnings
export interface ManifestUpdateAlert {
  from: string;
  to: string;
  message: string;
}

export interface PackageBackup {
  name: string;
  path: string;
  service?: string;
}

export interface Dependencies {
  [dependencyName: string]: string;
}

// Driver

export type ChainDriver = ChainDriverType | ChainDriverSpecs;

export type ChainDriverSpecs = {
  driver: ChainDriverType;
  serviceName?: string;
  portNumber?: number;
};

export type ChainDriverType = (typeof chainDriversTypes)[number];
export const chainDriversTypes = [
  "bitcoin",
  "ethereum",
  "ethereum-beacon-chain",
  "ethereum2-beacon-chain-prysm",
  "monero",
] as const;

// HTTPS ports
interface ExposableServiceManifestInfo {
  name: string;
  description?: string;
  serviceName?: string;
  fromSubdomain?: string;
  port: number;
  exposeByDefault?: boolean;
}

// Arch

export type Architecture = (typeof architectures)[number];
export const architectures = ["linux/amd64", "linux/arm64"] as const;
