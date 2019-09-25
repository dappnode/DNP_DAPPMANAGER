import "mocha";
import { expect } from "chai";

import * as parse from "../../src/utils/parse";

describe("Util: parse", function() {
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
