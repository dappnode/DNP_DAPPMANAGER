const expect = require("chai").expect;

const shell = require("modules/docker/shell");

describe("Util: shell", () => {
  it("should return an error when cating a non-existing file", async () => {
    let res = await shell("cat package.json");
    expect(res).to.include('"dependencies": {');
  });

  it("should return the content of a file when cating", async () => {
    let error = "--- shell did not throw ---";
    try {
      await shell("cat jfnakjsdfnodfu9sadf");
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("No such file");
  });
});
