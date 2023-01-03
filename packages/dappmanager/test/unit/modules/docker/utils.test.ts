import "mocha";
import { expect } from "chai";

import {
  getDockerTimeoutMax,
  ensureUniquePortsFromDockerApi,
  stripDockerApiLogsHeaderAndAnsi
} from "../../../../src/modules/docker/utils";
import { PackageContainer } from "@dappnode/common";
import { mockContainer } from "../../../testUtils";
import Dockerode from "dockerode";

describe("docker API > utils", () => {
  describe("stripDockerApiLogsHeaderAndAnsi", () => {
    const logSample = `
\u0001\u0000\u0000\u0000\u0000\u0000\u0000O\u001b[32minfo\u001b[39m Starting cache DB cacheDbPath: \"/usr/src/app/data/cachedb.json\"\n
\u0001\u0000\u0000\u0000\u0000\u0000\u0000L\u001b[32minfo\u001b[39m IPFS HTTP API httpApiUrl: \"http://ipfs.dappnode:5001/api/v0\"
\u0001\u0000\u0000\u0000\u0000\u0000\u0000X\u001b[32minfo\u001b[39m IPFS Cluster HTTP API clusterApiUrl: \"http://ipfs-cluster.dappnode:9094\"
\u0001\u0000\u0000\u0000\u0000\u0000\u0000N\u001b[32minfo\u001b[39m Web3 connected (ethers 4.0.39): http://fullnode.dappnode:8545
\u0001\u0000\u0000\u0000\u0000\u0000\u00003\u001b[32minfo\u001b[39m Webserver on 80, /usr/src/app/dist`;

    const logSampleCleanExpected = `
info Starting cache DB cacheDbPath: "/usr/src/app/data/cachedb.json"\n
info IPFS HTTP API httpApiUrl: "http://ipfs.dappnode:5001/api/v0"
info IPFS Cluster HTTP API clusterApiUrl: "http://ipfs-cluster.dappnode:9094"
info Web3 connected (ethers 4.0.39): http://fullnode.dappnode:8545
info Webserver on 80, /usr/src/app/dist`;

    it("Should strip header from logs with header", () => {
      const logSampleClean = stripDockerApiLogsHeaderAndAnsi(logSample);
      expect(logSampleClean).to.equal(logSampleCleanExpected);
    });

    it("Should not strip anything from clean logs", () => {
      const logSampleClean = stripDockerApiLogsHeaderAndAnsi(
        logSampleCleanExpected
      );
      expect(logSampleClean).to.equal(logSampleCleanExpected);
    });
  });

  describe("getDockerTimeoutMax", () => {
    it("Should find the max dockerTimeout in all containers", () => {
      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          dockerTimeout: 120
        },
        {
          ...mockContainer,
          dockerTimeout: 60
        }
      ];
      const timeout = getDockerTimeoutMax(containers);
      expect(timeout).to.equal(120);
    });
  });

  describe("parseDockerApiListPorts", () => {
    it("Should parse the docker ports from docker api (not duplicated)", () => {
      const dockerApiPorts: Dockerode.Port[] = [
        {
          IP: "0.0.0.0",
          PrivatePort: 30303,
          PublicPort: 49969,
          Type: "tcp"
        },
        {
          IP: "::",
          PrivatePort: 30303,
          PublicPort: 49969,
          Type: "tcp"
        },
        {
          IP: "0.0.0.0",
          PrivatePort: 30303,
          PublicPort: 49939,
          Type: "udp"
        },
        {
          IP: "::",
          PrivatePort: 30303,
          PublicPort: 49939,
          Type: "udp"
        },
        {
          IP: "0.0.0.0",
          PrivatePort: 30304,
          PublicPort: 49968,
          Type: "tcp"
        },
        {
          IP: "::",
          PrivatePort: 30304,
          PublicPort: 49968,
          Type: "tcp"
        },
        {
          IP: "0.0.0.0",
          PrivatePort: 30304,
          PublicPort: 49938,
          Type: "udp"
        },
        {
          IP: "::",
          PrivatePort: 30304,
          PublicPort: 49938,
          Type: "udp"
        }
      ];

      const expectedPorts = [
        {
          host: 49969,
          container: 30303,
          protocol: "TCP",
          deletable: true
        },
        {
          host: 49939,
          container: 30303,
          protocol: "UDP",
          deletable: true
        },
        {
          host: 49968,
          container: 30304,
          protocol: "TCP",
          deletable: true
        },
        {
          host: 49938,
          container: 30304,
          protocol: "UDP",
          deletable: true
        }
      ];

      const dockerApiPortsParsed = ensureUniquePortsFromDockerApi(
        dockerApiPorts,
        undefined
      );
      expect(dockerApiPortsParsed).to.eql(expectedPorts);
    });
  });
});
