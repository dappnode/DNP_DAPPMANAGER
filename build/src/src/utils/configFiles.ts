import fs from "fs";
import * as getPath from "./getPath";
import * as validate from "./validate";
import { writeComposeObj, readComposeObj } from "./dockerComposeFile";
import * as envsHelper from "./envsHelper";
import {
  writeDefaultsToLabels,
  writeMetadataToLabels
} from "./containerLabelsDb";
import {
  parseEnvironment,
  stringifyEnvironment,
  parseServiceName,
  parseService
} from "./dockerComposeParsers";
import params from "../params";
import {
  Compose,
  Manifest,
  UserSetPackageVols,
  UserSetPackagePorts,
  UserSetPackageEnvs,
  UserSetPackageVolsSingle,
  UserSetPackagePortsSingle,
  PackageEnvs,
  ComposeService
} from "../types";

/**
 * Returns a new compose after merging the user set data
 * - environment
 * - volumes
 * - ports
 */
export function mergeUserSetToCompose(
  compose: Compose,
  {
    userSetDnpVols = {},
    userSetDnpPorts = {},
    userSetDnpEnvs = {},
    previousEnvs = {}
  }: {
    userSetDnpVols: UserSetPackageVolsSingle;
    userSetDnpPorts: UserSetPackagePortsSingle;
    userSetDnpEnvs: PackageEnvs;
    previousEnvs: PackageEnvs;
  }
): Compose {
  const serviceName = parseServiceName(compose);
  const service = compose.services[serviceName];
  const defaultEnvironment = service.environment || [];
  const defaultVolumes = service.volumes || [];
  const defaultPorts = service.ports || [];

  return {
    ...compose,
    services: {
      [serviceName]: {
        ...service,
        /**
         * Merge ENVs by priority
         * 1. userSet on installation
         * 2. previously set (already installed DNPs)
         * 3. default values from the manifest
         * Empty values will NOT be replaced on updates.
         */
        environment: stringifyEnvironment({
          ...parseEnvironment(defaultEnvironment),
          ...previousEnvs,
          ...userSetDnpEnvs
        }),
        volumes: defaultVolumes.map(vol => userSetDnpVols[vol] || vol),
        ports: defaultPorts.map(port => userSetDnpPorts[port] || port),

        /**
         * Add the default values as labels
         */
        labels: {
          ...service.labels,
          ...writeDefaultsToLabels({
            defaultEnvironment,
            defaultVolumes,
            defaultPorts
          })
        }
      }
    }
  };
}

/**
 * Returns a new compose object with default data appended to it
 * - logging data to prevent huge logs
 * - custom labels to store: dependencies, chain, origin, isCore
 * - common dns
 * - DAppNode internal network
 */
export function addDefaultDataToCompose(
  compose: Compose,
  {
    metadata,
    origin,
    isCore
  }: {
    metadata: Manifest;
    origin: string;
    isCore: boolean;
  }
): Compose {
  const serviceName = parseServiceName(compose);
  const service = compose.services[serviceName];

  return {
    ...compose,
    services: {
      [serviceName]: {
        ...service,
        // Add logging options to prevent huge log files
        logging: {
          options: {
            "max-size": "10m",
            "max-file": "3"
          }
        },
        // Add custom labels
        labels: {
          ...service.labels,
          ...writeMetadataToLabels({
            dependencies: metadata.dependencies || {},
            chain: metadata.chain || "",
            origin,
            isCore
          })
        },
        // Add common DNS
        dns: params.DNS_SERVICE,
        // Add network settings
        ...(!isCore ? { networks: [params.DNP_NETWORK_EXTERNAL_NAME] } : {})
      }
    },
    networks: !isCore
      ? {
          [params.DNP_NETWORK_EXTERNAL_NAME]: {
            external: true
          }
        }
      : compose.networks || {}
  };
}

/**
 * Writes the configuration files of a DNP:
 * - docker-compose.yml
 * - dappnode_package.json
 *
 * Get the default settings and the user settings and merges them
 * to generate the actual docker-compose use to run the DNP and writes
 * the default values as labels.
 */
export function writeConfigFiles({
  name,
  origin,
  isCore,
  compose,
  metadata,
  userSetVols,
  userSetPorts,
  userSetEnvs
}: {
  name: string;
  origin: string | null;
  isCore: boolean;
  compose: Compose;
  metadata: Manifest;
  userSetVols?: UserSetPackageVols;
  userSetPorts?: UserSetPackagePorts;
  userSetEnvs?: UserSetPackageEnvs;
}): void {
  // Write metadata / manifest
  const manifestPath = validate.path(getPath.manifest(name, isCore));
  fs.writeFileSync(manifestPath, JSON.stringify(metadata, null, 2));

  // Write compose with user set data, and previous
  const composeWithUserSettings = mergeUserSetToCompose(compose, {
    userSetDnpEnvs: (userSetEnvs || {})[name] || {},
    userSetDnpPorts: (userSetPorts || {})[name] || {},
    userSetDnpVols: (userSetVols || {})[name] || {},
    previousEnvs: envsHelper.load(name, isCore)
  });
  let CHANGE_OLD_ENVS_SOURCE__NOW_COME_FROM_OLD_COMPOSE;
  let READ_OLD_PORT_MAPPINGS_FROM_COMPOSE;

  const composeWithUserSettingsAndData = addDefaultDataToCompose(
    composeWithUserSettings,
    { metadata, isCore, origin: origin || "" }
  );

  const composePath = validate.path(getPath.dockerCompose(name, isCore));
  writeComposeObj(composePath, composeWithUserSettingsAndData);
}

export function readConfigFiles(
  name: string,
  isCore: boolean
): { manifest: Manifest; compose: Compose; environment: PackageEnvs } {
  const manifestPath = validate.path(getPath.manifest(name, isCore));
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const composePath = validate.path(getPath.dockerCompose(name, isCore));
  const compose = readComposeObj(composePath);
  const service = parseService(compose);
  const environment = parseEnvironment(service.environment || []);

  return { manifest, compose, environment };
}
