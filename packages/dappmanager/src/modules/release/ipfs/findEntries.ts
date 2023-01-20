import { releaseFiles } from "../../../params.js";
import { FileConfig, IPFSEntryName } from "../types.js";

type ReleaseFiles = typeof releaseFiles;

// Overload to strictly type the return according to the fildId
export function findEntries<
  T extends IPFSEntryName,
  K extends keyof ReleaseFiles
>(
  files: T[],
  config: Omit<FileConfig, "format">,
  fileId: K
): ReleaseFiles[K] extends { multiple: true }
  ? T[]
  : ReleaseFiles[K] extends { required: true }
  ? T
  : T | undefined;

export function findEntries<T extends IPFSEntryName>(
  files: T[],
  config: Omit<FileConfig, "format">,
  fileId: string
): T[] | T | undefined {
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
