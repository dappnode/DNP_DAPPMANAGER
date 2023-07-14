// This will be used later in our root reducer and selectors
export const relativePath = "packages"; // default redirect to packages
export const rootPath = relativePath + "/*";
export const title = "Packages";

// SubPaths
export const systemPackagesSubPath = "system";
export const myPackagesSubPath = "my";
export const systemPackagesPath = rootPath + systemPackagesSubPath;
