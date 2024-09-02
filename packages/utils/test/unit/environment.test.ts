import "mocha";
import { expect } from "chai";
import { parseEnvironment, stringifyEnvironment } from "../../src/index.js";

describe("environment: parse, stringify", () => {
  const envsArray = ["NAME=VALUE", "NOVAL", "COMPLEX=D=D=D  = 2"];
  const envs = {
    NAME: "VALUE",
    NOVAL: "",
    COMPLEX: "D=D=D  = 2"
  };

  it("Should parse an envsArray", () => {
    expect(parseEnvironment(envsArray)).to.deep.equal(envs);
  });

  it("Should stringify an envs object", () => {
    expect(stringifyEnvironment(envs)).to.deep.equal(envsArray);
  });
});
