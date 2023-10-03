import fs from "fs";
import pathUtil from "path";

export function validatePath(filePath: string): string {
  // shell.mkdir('-p', fullPath);
  // directory exists
  const parentPath = pathUtil.parse(filePath).dir;
  if (!fs.existsSync(parentPath)) {
    fs.mkdirSync(parentPath, { recursive: true });
  }

  // returning so it can be used as
  // > await fs.writeFileSync(validate.path(path), data)
  return filePath;
}
