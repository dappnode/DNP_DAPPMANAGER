// This will be used later in our root reducer and selectors
export const relativePath = "packages/my"; // default redirect to packages
export const basePath = "packages";
export const rootPath = `${basePath}/*`;
export const title = "Packages";

export const mySubPath = "my";
export const systemSubPath = "system";

export const subPaths = {
  my: `${mySubPath}/*`,
  system: `${systemSubPath}/*`
};
