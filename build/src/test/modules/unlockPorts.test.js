const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");

describe("Module: unlockPorts", function() {
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  const pkg = {
    name: "kovan.dnp.dappnode.eth",
    ver: "0.1.0",
    manifest: {
      image: {
        ports: ["30303", "30303/udp"]
      },
      isCore: false
    }
  };

  const dockerComposePath = getPath.dockerCompose(pkg.name, params);

  const docker = {
    compose: {
      up: async () => {}
    }
  };

  const unlockPorts = proxyquire("modules/unlockPorts", {
    "modules/docker": docker,
    params: params
  });

  before(() => {
    validate.path(dockerComposePath);
    const dockerComposeString = `
version: '3.4'
services:
    ${pkg.name}:
        ports:
            - '32768:30303/udp'
            - '32768:30303'
            - '5001:5001'
        labels:
            portsToClose: '[{"number":32768,"type":"UDP"},{"number":32768,"type":"TCP"}]'
`;
    fs.writeFileSync(dockerComposePath, dockerComposeString);
  });

  it("should unlock ports and return portsToClose (NON core)", async () => {
    const portsToClose = await unlockPorts(dockerComposePath);
    expect(portsToClose).to.deep.equal([
      { number: 32768, type: "UDP" },
      { number: 32768, type: "TCP" }
    ]);
  });

  it("should have modified the docker-compose (NON core)", async () => {
    const dc = fs.readFileSync(dockerComposePath, "utf8");
    expect(dc).to.equal(`version: '3.4'
services:
    ${pkg.name}:
        ports:
            - 30303/udp
            - '30303'
            - '5001:5001'
`);
  });

  after(() => {
    fs.unlinkSync(dockerComposePath);
  });
});
