// This will be used later in our root reducer and selectors
export const relativePath = "installer/dnp";
export const getInstallerPath = (dnpName: string) => {
  if (dnpName.includes("public")) return "/installer/public";
  return "/installer/dnp";
};
export const rootPath = "installer";
export const title = "DAppStore";

// Subpaths
export const subPaths = {
  dnp: "dnp",
  public: "public"
};
