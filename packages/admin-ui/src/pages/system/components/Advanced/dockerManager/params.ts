import semver from "semver";

export const params = {
  // Docker engine stable versions: CLI, PKG and CONTAINERD
  // BUSTER | BULLYESE
  STABLE_DOCKER_ENGINE_VERSION_BUSTER: "20.10.2", // Same for server and CLI
  STABLE_DOCKER_CONTAINERD_VERSION_BUSTER: "1.4.3-1",
  // STRETCH
  STABLE_DOCKER_ENGINE_VERSION_STRETCH: "19.03.8",
  STABLE_DOCKER_CONTAINERD_VERSION_STRETCH: "1.2.6-3",

  // Docker compose stable versions
  STABLE_DOCKER_COMPOSE_VERSION: "1.25.5",

  // HOST REQUIREMENTS
  ARCHITECTURE: ["amd64", "arm64"],
  VERSION_CODENAME: ["buster", "stretch", "bullyese"],
  OS: ["debian"]
};

export const getIsOs = (hostOs: string) =>
  params.OS.some(os => os === hostOs.toLowerCase());

export const getIsArchitecture = (hostArchitecture: string) =>
  params.ARCHITECTURE.some(
    architecture => architecture === hostArchitecture.toLowerCase()
  );

export const getIsOsVersion = (hostOsVersion: string) =>
  params.VERSION_CODENAME.some(
    versionCodename => versionCodename === hostOsVersion.toLowerCase()
  );

export const getIsDockerEngineUpgrade = (
  hostOsVersion: string,
  hostDockerVersion: string
) =>
  hostOsVersion === "buster" || "bullyese"
    ? semver.lt(hostDockerVersion, params.STABLE_DOCKER_ENGINE_VERSION_BUSTER)
    : "stretch"
    ? semver.lt(hostDockerVersion, params.STABLE_DOCKER_ENGINE_VERSION_STRETCH)
    : false;

export const getIsDockerSynchronized = (
  hostDockerServerVersion: string,
  hostDockerCliVersion: string
) => semver.eq(hostDockerServerVersion, hostDockerCliVersion);

export const getIsDockerComposeUpgrade = (hostDockerComposeVersion: string) =>
  semver.lt(hostDockerComposeVersion, params.STABLE_DOCKER_COMPOSE_VERSION);
