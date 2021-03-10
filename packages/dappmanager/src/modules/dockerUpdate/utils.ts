import { params } from "./params";
import semver from "semver";

export const getIsOs = (hostOs: string): boolean =>
  params.OS.some(os => os === hostOs.toLowerCase());

export const getIsArchitecture = (hostArchitecture: string): boolean =>
  params.ARCHITECTURE.some(
    architecture => architecture === hostArchitecture.toLowerCase()
  );

export const getIsOsVersion = (hostOsVersion: string): boolean =>
  params.VERSION_CODENAME.some(
    versionCodename => versionCodename === hostOsVersion.toLowerCase()
  );

export const getIsDockerEngineUpgrade = (
  hostOsVersion: string,
  hostDockerVersion: string
): boolean =>
  hostOsVersion === "buster" || "bullyese"
    ? semver.lt(hostDockerVersion, params.STABLE_DOCKER_ENGINE_VERSION_BUSTER)
    : "stretch"
    ? semver.lt(hostDockerVersion, params.STABLE_DOCKER_ENGINE_VERSION_STRETCH)
    : false;

export const getIsDockerSynchronized = (
  hostDockerServerVersion: string,
  hostDockerCliVersion: string
): boolean => semver.eq(hostDockerServerVersion, hostDockerCliVersion);

export const getIsDockerComposeUpgrade = (
  hostDockerComposeVersion: string
): boolean =>
  semver.lt(hostDockerComposeVersion, params.STABLE_DOCKER_COMPOSE_VERSION);

export const getIsDockerEngineUpdateCompatible = (
  hostDockerComposeVersion: string
): boolean => {
  // Check if update is compatible with docker compose
  const arrayDockerComposeVersions = params.COMPATIBILITY_COMPOSE_ENGINE.map(
    group => group.dockerComposeVersion
  );
  for (const [index, version] of arrayDockerComposeVersions.entries()) {
    if (semver.gt(version, hostDockerComposeVersion)) {
      return semver.satisfies(
        hostDockerComposeVersion,
        `${arrayDockerComposeVersions[index - 1]} - ${version}`
      );
    }
  }
  return false;
};

export const getIsDockerComposeUpdateCompatible = (
  hostDockerEngineVersion: string
): boolean => {
  // Check if update is compatible with docker engine
  const arrayDockerEngineVersions = params.COMPATIBILITY_COMPOSE_ENGINE.map(
    group => group.dockerEngineVersion
  );
  for (const [index, version] of arrayDockerEngineVersions.entries()) {
    if (semver.gt(version, hostDockerEngineVersion)) {
      return semver.satisfies(
        hostDockerEngineVersion,
        `${arrayDockerEngineVersions[index - 1]} - ${version}`
      );
    }
  }
  return false;
};
