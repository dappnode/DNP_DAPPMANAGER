export const params = {
  // Docker engine stable versions: CLI, PKG and CONTAINERD
  // BUSTER | BULLYESE
  STABLE_DOCKER_ENGINE_VERSION_BUSTER: "20.10.2", // Same for server and CLI
  STABLE_DOCKER_CONTAINERD_VERSION_BUSTER: "1.4.3-1",
  // STRETCH
  STABLE_DOCKER_ENGINE_VERSION_STRETCH: "19.03.8",
  STABLE_DOCKER_CONTAINERD_VERSION_STRETCH: "1.2.6-3",

  // compose-engine compatibility
  COMPATIBILITY_COMPOSE_ENGINE: [
    {
      dockerEngineVersion: "17.04.0",
      dockerComposeVersion: "1.13.0",
      dockerComposeFileVersion: "3.2"
    },
    {
      dockerEngineVersion: "17.06.0",
      dockerComposeVersion: "1.14.0",
      dockerComposeFileVersion: "3.3"
    },
    {
      dockerEngineVersion: "17.09.0",
      dockerComposeVersion: "1.17.0",
      dockerComposeFileVersion: "3.4"
    },
    {
      dockerEngineVersion: "17.12.0",
      dockerComposeVersion: "1.18.0",
      dockerComposeFileVersion: "3.5"
    },
    {
      dockerEngineVersion: "18.02.0",
      dockerComposeVersion: "1.20.0",
      dockerComposeFileVersion: "3.6"
    },
    {
      dockerEngineVersion: "18.06.0",
      dockerComposeVersion: "1.22.0",
      dockerComposeFileVersion: "3.7"
    },
    {
      dockerEngineVersion: "19.03.0",
      dockerComposeVersion: "1.25.5",
      dockerComposeFileVersion: "3.8"
    }
  ],

  // Docker compose stable versions
  STABLE_DOCKER_COMPOSE_VERSION: "1.25.5",

  // HOST REQUIREMENTS
  ARCHITECTURE: ["amd64", "arm64"],
  VERSION_CODENAME: ["buster", "stretch", "bullyese"],
  OS: ["debian"]
};
