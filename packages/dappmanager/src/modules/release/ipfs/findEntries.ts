import { releaseFiles } from "../../../params";
import { IpfsFileResult } from "../../../types";
import { FileConfig } from "./types";

type ReleaseFiles = typeof releaseFiles;

// Overload to strictly type the return according to the fildId
export function findEntries<K extends keyof ReleaseFiles>(
  files: IpfsFileResult[],
  config: Omit<FileConfig, "format">,
  fileId: K
): ReleaseFiles[K] extends { multiple: true }
  ? IpfsFileResult[]
  : ReleaseFiles[K] extends { required: true }
  ? IpfsFileResult
  : IpfsFileResult | undefined;

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
      throw Error(`Multiple possible entries found for ${fileId}`);
    return matches[0];
  }
}
