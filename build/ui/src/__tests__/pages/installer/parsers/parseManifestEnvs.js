import parseManifestEnvs from "../../../../pages/installer/parsers/parseManifestEnvs";

describe("parseManifestEnvs", () => {
  it("Should merge ENVs from all sources in the ln.dnp.dappnode.eth case", () => {
    const manifest = {
      image: {
        environment: ["ENV_NAME1=ENV_VALUE1", "ENV_NAME2=ENV_VALUE1"]
      }
    };
    expect(parseManifestEnvs(manifest)).toEqual({
      ENV_NAME1: {
        index: 0,
        name: "ENV_NAME1",
        value: "ENV_VALUE1"
      },
      ENV_NAME2: {
        index: 1,
        name: "ENV_NAME2",
        value: "ENV_VALUE1"
      }
    });
  });
});
