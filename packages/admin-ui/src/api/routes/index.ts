import { IApiRoutes } from "api/interface";
import { apiUrls } from "params";
import { urlJoin } from "utils/url";

export const apiRoutes: IApiRoutes = {
  fileDownloadUrl({ containerName, path }) {
    return urlJoin(apiUrls.fileDownload, containerName, `?path=${path}`);
  },

  downloadUrl({ fileId }) {
    return urlJoin(apiUrls.download, fileId);
  },

  downloadWireguardConfig({ device, isLocal }) {
    const url = urlJoin(apiUrls.downloadWireguardConfig, device);
    return isLocal ? `${url}?local` : url;
  },

  userActionLogsUrl() {
    return apiUrls.userActionLogs;
  },

  containerLogsUrl({ containerName }) {
    return urlJoin(apiUrls.containerLogs, containerName);
  },

  async uploadFile(file, onProgress) {
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
      xhr.addEventListener("error", _e => reject(Error("Error loading file")));

      if (xhr.upload)
        xhr.upload.addEventListener("progress", onProgress, false);

      // Set up our request
      xhr.open("POST", apiUrls.upload);
      // The data sent is what the user provided in the form
      xhr.send(formData);
    });
  }
};
