import "mocha";
import { expect } from "chai";
import { dockerEngineVersion } from "../../src/api/getVersion.js";

describe.only("get docker version", () => {
  it("should return the docker version", async () => {
    console.log(dockerEngineVersion);
  });
});
