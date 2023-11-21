import {
  DistributedFile,
  ReleaseSignature,
  FileFormat,
  Manifest,
  Compose,
} from "@dappnode/common";
import { IPFSEntry } from "ipfs-core-types/src/root";

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
