// This will be used later in our root reducer and selectors
export const relativePath = "installer/dnp";
import { withLegacyBase } from "utils/path";
export const getInstallerPath = (dnpName: string) => {
  if (dnpName.includes("public")) return withLegacyBase("installer/public");
  return withLegacyBase("installer/dnp");
};
export const rootPath = "installer/*";
export const title = "DAppStore";

// Subpaths
export const subPaths = {
  dnp: "dnp/*",
  public: "public/*"
};
