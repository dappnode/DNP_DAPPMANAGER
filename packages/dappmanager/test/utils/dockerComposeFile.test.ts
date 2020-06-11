import "mocha";
import { expect } from "chai";
import fs from "fs";
import {
  createTestDir,
  cleanTestDir,
  createDirP,
  portProtocols
} from "../testUtils";

import {
  mergePortMapping,
  getDockerComposePath
} from "../../src/utils/dockerComposeFile";

describe("Util: dockerComposeFile", () => {
  const id = "test-dnp.dnp.dappnode.eth";

  describe("mergePortMapping", () => {
    beforeEach(async () => {
      await createTestDir();
    });

    it("should merge a ports array into a docker-compose", async () => {
      const portMappings = [
        // Add a new port
        { host: 4004, container: 4001, protocol: portProtocols.TCP },
        // Modify the mapping of two port protocols
        { host: 30673, container: 30303, protocol: portProtocols.TCP },
        { host: 30673, container: 30303, protocol: portProtocols.UDP },
        // Make one mapped port ephemeral
        { container: 16001, protocol: portProtocols.TCP }
      ];

      await createTestDir();
      const dockerComposePath = getDockerComposePath(id, true);
      await createDirP(dockerComposePath);
      fs.writeFileSync(
        dockerComposePath,
        `version: '3.4'
services:
  ${id}:
    ports:
      - '8090:80'
      - '16001:16001'
      - '30303:30303'
      - '30303:30303/udp'
`
      );

      mergePortMapping(id, portMappings);

      const newComposeString = fs.readFileSync(dockerComposePath, "utf8");

      expect(newComposeString).to.equal(
        `version: '3.4'
services:
  ${id}:
    ports:
      - '4004:4001'
      - '30673:30303'
      - '30673:30303/udp'
      - '16001'
      - '8090:80'
`,
        "Wrong new compose"
      );
    });

    afterEach(async () => {
      await cleanTestDir();
    });
  });
});
