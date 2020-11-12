import { mapValues } from "lodash";
import { IpfsFileResult } from "../../../types";
import { releaseFiles } from "../../../params";

type ReleaseFiles = typeof releaseFiles;
export type ReleaseIpfsFiles = {
  [K in keyof ReleaseFiles]: ReleaseFiles[K] extends { multiple: true }
    ? IpfsFileResult[]
    : ReleaseFiles[K] extends { required: true }
    ? IpfsFileResult
    : IpfsFileResult | undefined;
};

export function parseReleaseDirectory(
  files: IpfsFileResult[]
): ReleaseIpfsFiles {
  const filesGrouped = mapValues(releaseFiles, (fileConfig, fileId) =>
    fileConfig.multiple
      ? findMany(files, fileConfig, fileId)
      : findOne(files, fileConfig, fileId)
  );
  return filesGrouped as ReleaseIpfsFiles;
}

interface FileConfig {
  regex: RegExp;
  required: boolean;
  multiple: boolean;
}

export function findMany(
  files: IpfsFileResult[],
  config: FileConfig,
  fileId: string
): IpfsFileResult[] {
  const matches = files.filter(file => config.regex.test(file.name));
  if (matches.length === 0 && config.required)
    throw Error(`No ${fileId} found`);
  return matches;
}

export function findOne(
  files: IpfsFileResult[],
  config: FileConfig,
  fileId: string
): IpfsFileResult | undefined {
  const matches = findMany(files, config, fileId);
  if (matches.length > 1)
    throw Error(`Multiple possible entries found for ${config.regex}`);
  return matches[0];
}
