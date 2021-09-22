import { IPFSHTTPClient } from "ipfs-http-client";

export interface IpfsDagGet {
  Name: string;
  Size: number;
  Hash: string;
}

export interface IpfsCatOptions {
  maxLength?: number;
}

export type IpfsInstance = IPFSHTTPClient;

/**
 * From https://github.com/sindresorhus/ky/blob/2f37c3f999efb36db9108893b8b3d4b3a7f5ec45/index.js#L127-L132
 */
export const TimeoutErrorKy = class TimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
};
