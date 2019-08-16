const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const { createTestDir, cleanTestDir } = require("../testUtils");

describe("Call function: autoUpdateDataGet", () => {
  const autoUpdateDataGet = proxyquire("calls/autoUpdateDataGet", {
    "modules/dockerList": {
      listContainers: async () => [
        // ADD CONTAINERS
        {}
      ]
    }
  });

  describe("Call function autoUpdateDataGet", () => {
    before(async () => {
      await createTestDir();
    });

    it("should return auto-update data", async () => {
      const res = await autoUpdateDataGet();
      expect(res).to.deep.equal({
        message: "Got auto update data",
        result: {
          settings: {},
          registry: {},
          pending: {},
          dnpsToShow: [
            {
              name: "system-packages",
              enabled: false,
              feedback: "-"
            },
            {
              name: "my-packages",
              enabled: false,
              feedback: "-"
            }
          ]
        }
      });
    });

    after(async () => {
      await cleanTestDir();
    });
  });
});
