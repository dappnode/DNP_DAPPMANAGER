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

// Extract IPFSEntry type from ls since it's not exported
export type IPFSEntry = ReturnType<IPFSHTTPClient["ls"]>;

// {
//   name: string; // 'avatar.png',
//   path: string; // 'QmR7ALYdVQCSfdob9tzE8mvPn3KJk653maMqLeqMo7eeTg/avatar.png',
//   size: number; // 9305,
//   cid: CID;
//   type: string; // 'file',
//   depth: number; // 1,
//   hash: string; // 'QmRFfqN93JN5hDfqWhxaY6M16dafS6t9qzRCAKzzNT9ved',
// }

/**
 * From https://github.com/sindresorhus/ky/blob/2f37c3f999efb36db9108893b8b3d4b3a7f5ec45/index.js#L127-L132
 */
export const TimeoutErrorKy = class TimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
};
