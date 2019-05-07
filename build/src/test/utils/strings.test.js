const expect = require("chai").expect;

const { stripTrailingSlash } = require("utils/strings");

describe("utils > utils", () => {
  describe("utils > strings > stripTrailingSlash", () => {
    it("should strip one trailing slash", () => {
      expect(stripTrailingSlash("/dir/path/")).to.equal("/dir/path");
    });
    it("should strip trailing slashes", () => {
      expect(stripTrailingSlash("/dir/path///")).to.equal("/dir/path");
    });
  });
});
