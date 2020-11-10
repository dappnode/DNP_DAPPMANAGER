import "mocha";
import { expect } from "chai";
import { statsDiskGet } from "../../src/calls/statsDiskGet";
import { statsMemoryGet } from "../../src/calls/statsMemoryGet";

describe("Call the functions in charged of getting the host machine stats", () => {
  it("Should return parsed disk stats from host machine", done => {
    statsDiskGet()
      .then(result => {
        expect(result).to.be.ok;
      })
      .then(done, done);
  });
  it("Should return parsed memory stats from host machine", done => {
    statsMemoryGet()
      .then(result => {
        expect(result).to.be.ok;
      })
      .then(done, done);
  });
});
