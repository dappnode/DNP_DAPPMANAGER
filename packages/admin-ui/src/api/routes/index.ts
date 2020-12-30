import { apiUrls } from "params";
import { urlJoin } from "utils/url";

// For mock return: "data:text/csv;charset=utf-8;base64,dddddd"

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

/**
 * Legacy download file URL using both REST api and JSON RPC
 */
export function downloadUrl({ fileId }: { fileId: string }): string {
  return urlJoin(apiUrls.download, fileId);
}

export function userActionLogsUrl(): string {
  return apiUrls.userActionLogs;
}

export function containerLogsUrl(data: { containerName: string }): string {
  return urlJoin(apiUrls.containerLogs, data.containerName);
}

export async function uploadFile(
  file: File,
  onProgress: (data: { loaded: number; total: number }) => void
): Promise<{ fileId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Bind the FormData object and the form element
    const formData = new FormData();
    formData.append("file", file);

    // Define what happens on successful data submission
    xhr.addEventListener("load", e => {
      if (!e.target) return reject(Error("No upload responseText"));
      // ### Pending bug: .responseText is not typed in XMLHttpRequestEventTarget
      const fileId = (e.target as any).responseText;
      // if responseText is not a 32bytes hex, abort
      if (!/[0-9A-Fa-f]{64}/.test(fileId))
        return reject(Error(`Wrong response: ${fileId}`));

      resolve({ fileId });
    });

    // Define what happens in case of error
    xhr.addEventListener("error", e => reject(Error("Error loading file")));

    if (xhr.upload) xhr.upload.addEventListener("progress", onProgress, false);

    // Set up our request
    xhr.open("POST", apiUrls.upload);
    // The data sent is what the user provided in the form
    xhr.send(formData);
  });
}
