const expect = require("chai").expect;
const sinon = require("sinon");

const wrapMethodsWithQueue = require("utils/wrapMethodsWithQueue");

// resolves, fails once and then resolves
const succeeds = sinon.stub();
succeeds.onCall(0).rejects("error");
succeeds.onCall(1).resolves("result");
// fails, will fail always
const fails = sinon.stub();
fails.rejects("error");

const methods = {
  succeeds,
  fails
};
const params = {
  times: 2,
  intervalBase: 1 // All waits will be 1 ms
};

describe("ipfsQueueFactory", function() {
  let wrappedMethods;
  it("Should wrap the methods", () => {
    wrappedMethods = wrapMethodsWithQueue(methods, params);
  });

  it("Should call succeeds twice and finally return an success", async () => {
    let res = await wrappedMethods.succeeds();
    expect(res).to.equal("result");
    sinon.assert.callCount(succeeds, params.times);
  });

  it("Should call fails twice and finally return an error", () => {
    return wrappedMethods.fails().catch(err => {
      expect(err.message).to.equal("error");
      sinon.assert.callCount(fails, params.times);
    });
  });
});
