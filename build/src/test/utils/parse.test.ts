import "mocha";
import { expect } from "chai";

import * as parse from "../../src/utils/parse";

describe("Util: parse", function() {
  describe("parse and stringify envs", function() {
    const envs = {
      VAR1: "VALUE1",
      VAR2: "VALUE2"
    };
    const envString = `
VAR1=VALUE1\nVAR2=VALUE2
`.trim();

    it("should stringify an envs object", () => {
      expect(parse.stringifyEnvs(envs)).to.equal(envString);
    });

    it("should parse an env string", () => {
      expect(parse.envFile(envString)).to.deep.equal(envs);
    });
  });

  describe("parse and stringify empty envs", function() {
    const envs = {
      VIRTUAL_HOST: "",
      LETSENCRYPT_HOST: "",
      time: "1549562581242"
    };
    const envString = `
VIRTUAL_HOST=
LETSENCRYPT_HOST=
time=1549562581242
`.trim();

    it("should stringify an envs object", () => {
      expect(parse.stringifyEnvs(envs)).to.equal(envString);
    });

    it("should parse an env string", () => {
      expect(parse.envFile(envString)).to.deep.equal(envs);
    });
  });

  describe("parse Package request", function() {
    it("should parse a package request", () => {
      expect(parse.packageReq("package_name@version")).to.deep.equal({
        name: "package_name",
        ver: "version",
        req: "package_name@version"
      });
    });

    it("should add latest to verionless requests", () => {
      expect(parse.packageReq("package_name")).to.deep.equal({
        name: "package_name",
        ver: "*",
        req: "package_name"
      });
    });
  });
});
