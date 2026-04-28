import { PackagesConfig } from "pages-new/packages/config";

export const aiPackagesConfig: PackagesConfig = {
  sectionLabel: "AI",
  categoryFilter: { mode: "include", categories: ["AI"] },
  packagesPath: "/ai/packages",
  storePath: "/ai/store",
  installerPath: "/installer"
};
