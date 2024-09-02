import path from "path";
import { omit } from "lodash-es";

export function getBackupPath(anyPath: string): string {
  const pathObj = path.parse(anyPath);
  // From NodeJS docs
  // `name` + `ext` will be used if `base` is not specified.
  return path.format({
    ...omit(pathObj, "base"),
    ext: `.backup${pathObj.ext}`
  });
}
