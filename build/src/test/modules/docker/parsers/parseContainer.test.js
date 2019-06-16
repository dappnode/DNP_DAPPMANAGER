const expect = require("chai").expect;

const parseContainer = require("modules/docker/parsers/parseContainer");
// Mock data
const dockerApiResponseContainers = require("../dockerApiSamples/containers.json");

describe.skip("parseContainer", function() {
  it("should parse an entire dockerList", async () => {
    const dnpList = dockerApiResponseContainers.map(parseContainer);
    expect(dnpList).to.deep.equal([]);
  });
});
