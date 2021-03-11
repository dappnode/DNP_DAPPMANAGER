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

export const getIsDockerComposeStable = (
  hostDockerComposeVersion: string
): boolean =>
  !semver.lt(hostDockerComposeVersion, params.STABLE_DOCKER_COMPOSE_VERSION);
