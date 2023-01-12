import { expect } from "chai";
import { DockerVersionsScript, HostInfoScript } from "@dappnode/common";
import {
  supportedDebianReleases,
  supportedOs,
  targetDockerComposeVersion
} from "../../../../src/modules/dockerUpdate/params";
import {
  parseDockerComposeRequirements,
  parseDockerEngineRequirements
} from "../../../../src/modules/dockerUpdate/utils";

describe("dockerUpdate / parse docker engine update requirements", () => {
  it("Should not allow docker engine update", () => {
    const hostInfo: HostInfoScript = {
      dockerComposeVersion: "1.22.0",
      dockerServerVersion: "20.10.2",
      dockerCliVersion: "20.10.2",
      os: "ubuntu",
      versionCodename: "bionic",
      architecture: "amd64",
      kernel: "5.4.0-66-generic"
    };
    const dockerEngineUpdateRequirements =
      parseDockerEngineRequirements(hostInfo);
    const expectedParsedRequirements = {
      updated: false,
      version: "20.10.2",
      requirements: [
        {
          title: "Operating System (OS)",
          isFulFilled: false,
          message: `OS ${hostInfo.os} not supported. Allowed: ${supportedOs}`
        },
        {
          title: "OS Architecture",
          isFulFilled: true,
          message: `Arch ${hostInfo.architecture} supported`
        },
        {
          title: "OS release",
          isFulFilled: false,
          message: `Debian release ${
            hostInfo.versionCodename
          } not supported. Allowed ${supportedDebianReleases.join(", ")}`
        },

        // docker server version and docker cli versions should always be the same
        // If they are not the same the best solution from online forums is to reboot the host
        // and hope that the versions become the same again
        {
          title: "Docker engine versions synchronized",
          isFulFilled: true,
          message: `Docker server and Docker CLI versions are syncronized`
        },
        {
          title: "Docker compose compatibility",
          isFulFilled: false,
          message: `You must update Docker compose first. Current version ${hostInfo.dockerComposeVersion}, target version ${targetDockerComposeVersion}`
        }
      ]
    };
    expect(dockerEngineUpdateRequirements).to.deep.equal(
      expectedParsedRequirements
    );
  });
  it("Should allow docker engine update", () => {
    const hostInfo: HostInfoScript = {
      dockerComposeVersion: "1.25.5",
      dockerServerVersion: "19.03.8",
      dockerCliVersion: "19.03.8",
      os: "debian",
      versionCodename: "buster",
      architecture: "amd64",
      kernel: "5.4.0-66-generic"
    };
    const dockerEngineUpdateRequirements =
      parseDockerEngineRequirements(hostInfo);
    const expectedParsedRequirements = {
      updated: false,
      version: "19.03.8",
      requirements: [
        {
          title: "Operating System (OS)",
          isFulFilled: true,
          message: `OS ${hostInfo.os} supported`
        },
        {
          title: "OS Architecture",
          isFulFilled: true,
          message: `Arch ${hostInfo.architecture} supported`
        },
        {
          title: "OS release",
          isFulFilled: true,
          message: `Debian release ${hostInfo.versionCodename} supported`
        },

        // docker server version and docker cli versions should always be the same
        // If they are not the same the best solution from online forums is to reboot the host
        // and hope that the versions become the same again
        {
          title: "Docker engine versions synchronized",
          isFulFilled: true,
          message: `Docker server and Docker CLI versions are syncronized`
        },
        {
          title: "Docker compose compatibility",
          isFulFilled: true,
          message: `Docker compose is updated`
        }
      ]
    };
    expect(dockerEngineUpdateRequirements).to.deep.equal(
      expectedParsedRequirements
    );
  });
});

describe("dockerUpdate / parse docker compose update requirements", () => {
  it("Should not allow docker compose update", () => {
    const dockerVersions: DockerVersionsScript = {
      dockerComposeVersion: "1.25.5",
      dockerServerVersion: "20.10.2"
    };
    const dockerComposeUpdateRequirements =
      parseDockerComposeRequirements(dockerVersions);
    const expectedParsedRequirements = {
      updated: true,
      version: "1.25.5",
      requirements: []
    };
    expect(dockerComposeUpdateRequirements).to.deep.equal(
      expectedParsedRequirements
    );
  });
  it("Should allow docker compose update", () => {
    const dockerVersions: DockerVersionsScript = {
      dockerComposeVersion: "1.22.0",
      dockerServerVersion: "20.10.2"
    };
    const dockerComposeUpdateRequirements =
      parseDockerComposeRequirements(dockerVersions);
    const expectedParsedRequirements = {
      updated: false,
      version: "1.22.0",
      requirements: []
    };
    expect(dockerComposeUpdateRequirements).to.deep.equal(
      expectedParsedRequirements
    );
  });
});
