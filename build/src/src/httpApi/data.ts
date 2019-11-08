import url from "url";
import path from "path";
import params from "../params";

export const staticAssetsPath = params.avatarStaticDir;

export const getAvatarFileName = (hash: string): string => `${hash}.png`;
export const getAvatarUrl = (hash: string): string =>
  url.resolve(params.apiUrl, path.join("avatar", getAvatarFileName(hash)));
export const getAvatarPath = (hash: string): string =>
  path.join(staticAssetsPath, getAvatarFileName(hash));
