const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const getPath = require("utils/getPath");
const fs = require("fs");

describe("Util: restartPatch", () => {
  let dockerComposeUpArg;
  const docker = {
    compose: {
      up: async arg => {
        dockerComposeUpArg = arg;
      }
    }
  };
  const params = {
    DNCORE_DIR: "test_files",
    REPO_DIR: "test_files/"
  };
  const IMAGE_NAME = "dappmanager.tar.xz:0.0.9";
  const DOCKERCOMPOSE_RESTART_PATH = getPath.dockerCompose(
    "restart.dnp.dappnode.eth",
    params,
    true
  );

  const restartPatch = proxyquire("modules/restartPatch", {
    docker: docker,
    params: params
  });

  it("Should call docker.compose.up with the correct arguments", () => {
    restartPatch(IMAGE_NAME).then(() => {
      expect(dockerComposeUpArg).to.be.equal(DOCKERCOMPOSE_RESTART_PATH);
    });
  });

  it("Should generate a the correct docker-compose restart", () => {
    const dc = fs.readFileSync(DOCKERCOMPOSE_RESTART_PATH, "utf8");

    const expectedDc = `version: '3.4'

services:
    restart.dnp.dappnode.eth:
        image: dappmanager.tar.xz:0.0.9
        container_name: DAppNodeTool-restart.dnp.dappnode.eth
        volumes:
            - '/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml:/usr/src/app/DNCORE/docker-compose-dappmanager.yml'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            docker-compose -f /usr/src/app/DNCORE/docker-compose-dappmanager.yml up -d`;

    expect(dc).to.equal(expectedDc);
    fs.unlinkSync(DOCKERCOMPOSE_RESTART_PATH);
  });
});
