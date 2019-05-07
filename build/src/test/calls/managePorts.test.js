const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;

chai.should();

describe("Call function: managePorts", function() {
  const openedPorts = [];
  const upnpc = {
    open: async port => {
      openedPorts.push(port);
    }
  };

  const managePorts = proxyquire("calls/managePorts", {
    "modules/upnpc": upnpc
  });

  it("should open the requested ports", async () => {
    const ports = [5000, 5001];
    const res = await managePorts({
      action: "open",
      ports
    });
    // Check opened ports
    expect(openedPorts).to.deep.equal(ports);
    // Check response message
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should throw an error with wrong ports variable", async () => {
    let error = "--- managePorts did not throw ---";
    try {
      await managePorts({
        action: "open",
        ports: "not an array"
      });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("kwarg ports must be an array");
  });
});
