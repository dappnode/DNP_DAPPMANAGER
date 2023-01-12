import "mocha";
import { expect } from "chai";
import verifyState from "../../../../../src/modules/dappGet/resolve/verifyState";

describe.skip("verifyState", () => {
  const dnps = {
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

  it("should return true for a valid state", () => {
    const state = {
      A: "1.0.0",
      B: "1.0.0",
      C: "1.0.0"
    };
    const res = verifyState(state, dnps);
    expect(res.valid).to.be.true;
  });

  it("should return false, dependency no installed", () => {
    const state = {
      A: "1.0.0"
    };
    // { req: 'A@1.0.0', dep: 'C', depVer: undefined, reqRange: '^1.0.0' }
    const res = verifyState(state, dnps);
    expect(res.valid).to.be.false;
    expect(res.reason).to.deep.equal({
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
    expect(res.valid).to.be.false;
    expect(res.reason).to.deep.equal({
      req: "A@1.0.0",
      dep: "C@2.0.0",
      range: "^1.0.0"
    });
  });
});
