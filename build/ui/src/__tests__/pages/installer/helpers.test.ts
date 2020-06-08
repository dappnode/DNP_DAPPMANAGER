import filterDirectory from "pages/installer/helpers/filterDirectory";
import { DirectoryItem } from "types";
import { SelectedCategories } from "pages/installer/types";

const sampleDirectoryState: DirectoryItem = {
  status: "ok",
  name: "demo-name",
  description: "Demo description",
  avatarUrl: "",
  isInstalled: false,
  isUpdated: false,
  whitelisted: true,
  isFeatured: false,
  categories: ["Blockchain"]
};

describe("pages > installer > helpers", () => {
  describe("filterDirectory", () => {
    const dnp1Name = "dnp1.dnp.dappnode.eth";
    const dnp2Name = "dnp2.dnp.dappnode.eth";
    const dnp1: DirectoryItem = {
      ...sampleDirectoryState,
      name: dnp1Name,
      categories: ["Blockchain"]
    };
    const dnp2: DirectoryItem = {
      ...sampleDirectoryState,
      name: dnp2Name,
      categories: ["Storage"]
    };
    const directory: DirectoryItem[] = [dnp1, dnp2];

    it("Should filter directory by input", () => {
      const query = dnp1Name;
      const selectedCategories: SelectedCategories = {};
      expect(filterDirectory({ directory, query, selectedCategories })).toEqual(
        [dnp1]
      );
    });

    it("Should filter directory by type", () => {
      const query = "";
      const selectedCategories: SelectedCategories = {
        Blockchain: false,
        Storage: true
      };
      expect(filterDirectory({ directory, query, selectedCategories })).toEqual(
        [dnp2]
      );
    });
  });
});
