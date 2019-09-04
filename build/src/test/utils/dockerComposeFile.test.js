const expect = require("chai").expect;
const fs = require("fs");
const { createTestDir, cleanTestDir, createDirP } = require("../testUtils");

const {
  getComposeInstance,
  getDockerComposePath
} = require("utils/dockerComposeFile");

describe("Util: dockerComposeFile", () => {
  const id = "test-dnp.dnp.dappnode.eth";
  const portMappings = [
    // Add a new port
    { container: "4004:4001", protocol: "TCP" },
    // Modify the mapping of two port protocols
    { host: "30673", container: "30303", protocol: "TCP" },
    { host: "30673", container: "30303", protocol: "UDP" },
    // Make one mapped port ephemeral
    { container: "16001", protocol: "TCP" }
  ];

  before("write compose", async () => {
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
  });

  it("should merge a ports array into a docker-compose", () => {
    const compose = getComposeInstance(id);
    compose.mergePortMapping(portMappings);

    const newComposeString = fs.readFileSync(compose.dockerComposePath, "utf8");

    expect(newComposeString).to.equal(
      `version: '3.4'
services:
  ${id}:
    ports:
      - '8090:80'
      - '4004:4001'
      - '16001'
      - '30673:30303'
      - '30673:30303/udp'
`,
      "Wrong new compose"
    );
  });

  after(async () => {
    await cleanTestDir();
  });
});
