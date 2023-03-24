import { DistributedFile } from "@dappnode/common";
import { ReleaseSignature } from "../../types.js";
import { FileFormat } from "../../types.js";
import { Manifest, Compose } from "@dappnode/dappnodesdk";
import { IPFSEntry } from "../ipfs/types.js";

export interface FileConfig {
  regex: RegExp;
  format: FileFormat;
  maxSize: number;
  required: boolean;
  multiple: boolean;
}

export type ReleaseSignatureWithData = {
  signature: ReleaseSignature;
  signedData: string;
};

export interface ReleaseDownloadedContents {
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  composeUnsafe: Compose;
  manifest: Manifest;
  signature?: ReleaseSignatureWithData;
}

export type IPFSEntryName = Pick<IPFSEntry, "name">;
