const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const getPath = require("utils/getPath");
const fs = require("fs");

describe("Util: restartPatch", () => {
  const params = {
    DNCORE_DIR: "test_files",
    REPO_DIR: "test_files/"
  };
  const imageName = "dappmanager.dnp.dappnode.eth:0.2.0";
  const dockerComposeRestartPath = getPath.dockerCompose(
    "restart.dnp.dappnode.eth",
    params,
    true
  );

  describe("Just restart the DAPPMANAGER", () => {
    let dockerComposeUpArg;
    const docker = {
      compose: {
        up: async arg => {
          dockerComposeUpArg = arg;
        }
      }
    };
    const restartPatch = proxyquire("modules/restartPatch", {
      "modules/docker": docker,
      "modules/dockerList": async () => [],
      params: params
    });

    it("Should call docker.compose.up with the correct arguments", async () => {
      await restartPatch(imageName);
      expect(dockerComposeUpArg).to.be.equal(dockerComposeRestartPath);
    });

    it("Should generate a the correct docker-compose restart", () => {
      const dc = fs.readFileSync(dockerComposeRestartPath, "utf8");

      const expectedDc = `version: '3.4'

services:
    restart.dnp.dappnode.eth:
        image: dappmanager.dnp.dappnode.eth:0.2.0
        container_name: DAppNodeTool-restart.dnp.dappnode.eth
        volumes:
            - '/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml:/usr/src/app/DNCORE/docker-compose-dappmanager.yml'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            docker-compose -f /usr/src/app/DNCORE/docker-compose-dappmanager.yml up -d`;

      expect(dc).to.equal(expectedDc);
      fs.unlinkSync(dockerComposeRestartPath);
    });
  });

  describe("Restart the DAPPMANAGER and delete its volumes", () => {
    let dockerComposeUpArg;
    const docker = {
      compose: {
        up: async arg => {
          dockerComposeUpArg = arg;
        }
      }
    };
    const restartPatch = proxyquire("modules/restartPatch", {
      "modules/docker": docker,
      "modules/dockerList": async () => [],
      params: params
    });

    it("Should call docker.compose.up with the correct arguments", async () => {
      await restartPatch(imageName, { restartVolumes: true });
      expect(dockerComposeUpArg).to.be.equal(dockerComposeRestartPath);
    });

    it("Should generate a the correct docker-compose restart", () => {
      const dc = fs.readFileSync(dockerComposeRestartPath, "utf8");

      const expectedDc = `version: '3.4'

services:
    restart.dnp.dappnode.eth:
        image: dappmanager.dnp.dappnode.eth:0.2.0
        container_name: DAppNodeTool-restart.dnp.dappnode.eth
        volumes:
            - '/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml:/usr/src/app/DNCORE/docker-compose-dappmanager.yml'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            docker-compose -f /usr/src/app/DNCORE/docker-compose-dappmanager.yml down --volumes; docker-compose -f /usr/src/app/DNCORE/docker-compose-dappmanager.yml up -d`;

      expect(dc).to.equal(expectedDc);
      fs.unlinkSync(dockerComposeRestartPath);
    });
  });
});
