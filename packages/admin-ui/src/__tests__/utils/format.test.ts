import { prettyVolumeName } from "../../utils/format";

describe("utils > format", () => {
  describe("prettyVolumeName", () => {
    const dnpName = "geth-user.dnp.dappnode.eth";
    it("Prettify own volume name", () => {
      expect(
        prettyVolumeName("dncore_gethdnpdappnodeeth_data", dnpName)
      ).toEqual({
        name: "Data",
        owner: "Geth"
      });
    });

    it("Prettify other volume name", () => {
      expect(prettyVolumeName("gethuserdnpdappnodeeth_data", dnpName)).toEqual({
        name: "Data"
      });
    });

    it("Prettify wierd volume name", () => {
      const wierdName = "714673659786948756293876598768234";
      expect(prettyVolumeName(wierdName, dnpName)).toEqual({
        name: wierdName
      });
    });
  });
});
