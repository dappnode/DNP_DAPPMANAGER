import { IpfsFileResult } from "../../../types";
import { FileConfig } from "./types";

export function findEntries(
  files: IpfsFileResult[],
  config: Omit<FileConfig, "format">,
  fileId: string
): IpfsFileResult[] | IpfsFileResult | undefined {
  const matches = files.filter(file => config.regex.test(file.name));

  if (matches.length === 0 && config.required)
    throw Error(`No ${fileId} found`);

  if (config.multiple) {
    return matches;
  } else {
    if (matches.length > 1)
      throw Error(`Multiple possible entries found for ${config.regex}`);
    return matches[0];
  }
}
