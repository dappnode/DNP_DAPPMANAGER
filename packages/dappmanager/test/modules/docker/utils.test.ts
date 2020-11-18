import "mocha";
import { expect } from "chai";

import {
  getDockerTimeoutMax,
  stripDockerApiLogsHeader
} from "../../../src/modules/docker/utils";
import { PackageContainer } from "../../../src/types";
import { mockContainer } from "../../testUtils";

describe("docker API > utils", () => {
  describe("stripDockerApiLogsHeader", () => {
    const logSample = `
\u0001\u0000\u0000\u0000\u0000\u0000\u0000O\u001b[32minfo\u001b[39m Starting cache DB cacheDbPath: \"/usr/src/app/data/cachedb.json\"\n
\u0001\u0000\u0000\u0000\u0000\u0000\u0000L\u001b[32minfo\u001b[39m IPFS HTTP API httpApiUrl: \"http://ipfs.dappnode:5001/api/v0\"
\u0001\u0000\u0000\u0000\u0000\u0000\u0000X\u001b[32minfo\u001b[39m IPFS Cluster HTTP API clusterApiUrl: \"http://ipfs-cluster.dappnode:9094\"
\u0001\u0000\u0000\u0000\u0000\u0000\u0000N\u001b[32minfo\u001b[39m Web3 connected (ethers 4.0.39): http://fullnode.dappnode:8545
\u0001\u0000\u0000\u0000\u0000\u0000\u00003\u001b[32minfo\u001b[39m Webserver on 80, /usr/src/app/dist`;

    const logSampleCleanExpected = `
\u001b[32minfo\u001b[39m Starting cache DB cacheDbPath: \"/usr/src/app/data/cachedb.json\"\n
\u001b[32minfo\u001b[39m IPFS HTTP API httpApiUrl: \"http://ipfs.dappnode:5001/api/v0\"
\u001b[32minfo\u001b[39m IPFS Cluster HTTP API clusterApiUrl: \"http://ipfs-cluster.dappnode:9094\"
\u001b[32minfo\u001b[39m Web3 connected (ethers 4.0.39): http://fullnode.dappnode:8545
\u001b[32minfo\u001b[39m Webserver on 80, /usr/src/app/dist`;

    it("Should strip header from logs with header", () => {
      const logSampleClean = stripDockerApiLogsHeader(logSample);
      expect(logSampleClean).to.equal(logSampleCleanExpected);
    });

    it("Should not strip anything from clean logs", () => {
      const logSampleClean = stripDockerApiLogsHeader(logSampleCleanExpected);
      expect(logSampleClean).to.equal(logSampleCleanExpected);
    });
  });

  describe("getDockerTimeoutMax", () => {
    it("Should find the max dockerTimeout in all containers", () => {
      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          dockerTimeout: 120000
        },
        {
          ...mockContainer,
          dockerTimeout: 60000
        }
      ];
      const timeout = getDockerTimeoutMax(containers);
      expect(timeout).to.equal(120000);
    });
  });
});
