const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");
const { eventBusTag } = require("eventBus");
const shell = require("utils/shell");

describe("Call function: removePackage", function() {
  const testDir = "test_files/";
  const params = {
    REPO_DIR: testDir,
    DNCORE_DIR: "DNCORE"
  };

  const id = "test.dnp.dappnode.eth";
  const dockerComposePath = getPath.dockerCompose(id, params);
  const dockerComposeTemplate = `
  version: '3.4'
      services:
          ${id}:
              image: 'chentex/random-logger:latest'
              container_name: DNP_DAPPMANAGER_TEST_CONTAINER
  `.trim();

  const idWrong = "missing.dnp.dappnode.eth";

  const docker = {
    compose: {
      down: sinon.stub().resolves()
    }
  };

  const eventBusPackage = {
    eventBus: {
      emit: sinon.stub()
    },
    eventBusTag
  };

  // db to know UPnP state
  const db = {
    get: async key => {
      if (key === "upnpAvailable") return true;
    }
  };

  const removePackage = proxyquire("calls/removePackage", {
    "modules/docker": docker,
    eventBus: eventBusPackage,
    params: params,
    db: db
  });

  before(async () => {
    validate.path(dockerComposePath);
    fs.writeFileSync(dockerComposePath, dockerComposeTemplate);
  });

  it("should stop the package with correct arguments", async () => {
    const res = await removePackage({ id });
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should have called docker-compose down", async () => {
    sinon.assert.callCount(docker.compose.down, 1);
    expect(docker.compose.down.getCall(0).args).to.deep.equal(
      [dockerComposePath, { volumes: false }],
      `should call docker.compose.down for the package ${id}`
    );
  });

  it("should request to emit packages to refresh the UI", async () => {
    expect(eventBusPackage.eventBus.emit.getCall(0).args).to.deep.equal(
      [eventBusTag.emitPackages],
      `eventBus.emit first call must be to request emit packages`
    );
  });

  it("should throw an error with wrong package name", async () => {
    let error = "--- removePackage did not throw ---";
    try {
      await removePackage({ id: idWrong });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("No docker-compose found");
  });

  after(async () => {
    try {
      await shell(`rm -rf ${testDir}`);
    } catch (e) {
      //
    }
  });
});
