import { apiUrls } from "params";
import { urlJoin } from "utils/url";

/**
 * Get URL to download a specific path with an HTTP GET req
 */
export function fileDownloadUrl({
  containerName,
  path
}: {
  containerName: string;
  path: string;
}): string {
  return urlJoin(apiUrls.fileDownload, containerName, `?path=${path}`);
}
