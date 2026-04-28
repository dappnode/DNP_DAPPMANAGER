import { PackagesConfig } from "pages-new/packages/config";

export const stakingPackagesConfig: PackagesConfig = {
  sectionLabel: "Staking",
  categoryFilter: { mode: "exclude", categories: ["AI"] },
  packagesPath: "/staking/packages",
  storePath: "/staking/store",
  installerPath: "/installer"
};
