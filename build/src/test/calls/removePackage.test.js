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

  const manifestPath = getPath.manifest(id, params);
  const manifestTemplate = JSON.stringify({
    name: id,
    image: {
      ports: ["30303:30303/udp", "4001", "4001/udp"]
    }
  });
  const portsToClose = [
    { number: 32769, type: "UDP" },
    { number: 32769, type: "TCP" }
  ];
  const manifestParsedPorts = [{ number: "30303", type: "UDP" }];

  const idWrong = "missing.dnp.dappnode.eth";

  const dockerList = {
    listContainers: sinon.stub().resolves([
      {
        name: id,
        portsToClose
      }
    ])
  };

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
    "modules/dockerList": dockerList,
    eventBus: eventBusPackage,
    params: params,
    db: db
  });

  before(async () => {
    validate.path(dockerComposePath);
    fs.writeFileSync(dockerComposePath, dockerComposeTemplate);
    fs.writeFileSync(manifestPath, manifestTemplate);
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

  it("should emit an internal call to the eventBus", async () => {
    // eventBus should be called once to close ports, and then to emitPackages
    sinon.assert.callCount(eventBusPackage.eventBus.emit, 3);
    expect(eventBusPackage.eventBus.emit.getCall(0).args).to.deep.equal(
      [
        eventBusTag.call,
        {
          callId: "managePorts",
          kwargs: {
            action: "close",
            ports: [...manifestParsedPorts, ...portsToClose]
          }
        }
      ],
      `eventBus.emit first call must be to close the package's ports`
    );
  });

  it("should request to emit packages to refresh the UI", async () => {
    expect(eventBusPackage.eventBus.emit.getCall(1).args).to.deep.equal(
      [eventBusTag.emitPackages],
      `eventBus.emit second call must be to request emit packages`
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
