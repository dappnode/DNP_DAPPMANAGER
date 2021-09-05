import { FileFormat } from "../../types";
import { IPFSEntry } from "../ipfs";

export interface FileConfig {
  regex: RegExp;
  format: FileFormat;
  maxSize: number;
  required: boolean;
  multiple: boolean;
}

export type IPFSEntryName = Pick<IPFSEntry, "name">;
