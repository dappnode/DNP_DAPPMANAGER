const assert = require("assert");
const verifyState = require("modules/dappGet/resolve/verifyState");
const dnps = getDnps();

describe("verifyState", () => {
  it("should return true for a valid state", () => {
    const state = {
      A: "1.0.0",
      B: "1.0.0",
      C: "1.0.0"
    };
    const res = verifyState(state, dnps);
    assert.equal(res.valid, true);
  });

  it("should return false, dependency no installed", () => {
    const state = {
      A: "1.0.0"
    };
    // { req: 'A@1.0.0', dep: 'C', depVer: undefined, reqRange: '^1.0.0' }
    const res = verifyState(state, dnps);
    assert.equal(res.valid, false);
    assert.deepStrictEqual(res.reason, {
      req: "A@1.0.0",
      dep: "C@no-version",
      range: "^1.0.0"
    });
  });

  it("should return false, invalid dependency", () => {
    const state = {
      A: "1.0.0",
      C: "2.0.0"
    };
    // { req: 'A@1.0.0', dep: 'C', depVer: '2.0.0', reqRange: '^1.0.0' }
    const res = verifyState(state, dnps);
    assert.equal(res.valid, false);
    assert.deepStrictEqual(res.reason, {
      req: "A@1.0.0",
      dep: "C@2.0.0",
      range: "^1.0.0"
    });
  });
});

function getDnps() {
  return {
    A: {
      versions: {
        "1.0.0": { C: "^1.0.0" }
      }
    },
    B: {
      versions: {
        "1.0.0": { C: "^1.0.0" }
      }
    },
    C: {
      versions: {
        "1.0.0": {},
        "2.0.0": {}
      }
    }
  };
}
