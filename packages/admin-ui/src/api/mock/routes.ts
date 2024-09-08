import { IApiRoutes } from "api/interface";
import newTabProps from "utils/newTabProps";

// For mock return: "data:text/csv;charset=utf-8;base64,dddddd"

newTabProps.download = "test-dappnode-file";

export const apiRoutes: IApiRoutes = {
  fileDownloadUrl({ containerName, path }) {
    return generateDownloadUrl(`Sample file ${containerName} ${path}`);
  },

  downloadWireguardConfig({ device, isLocal }) {
    return generateDownloadUrl(`Sample wireguard config ${device} ${isLocal}`);
  },

  downloadUrl({ fileId }) {
    return generateDownloadUrl(`Sample file from ID ${fileId}`);
  },

  userActionLogsUrl() {
    return generateDownloadUrl("Sample user action logs");
  },

  containerLogsUrl({ containerName }) {
    return generateDownloadUrl(`Sample container logs ${containerName}`);
  },

  async uploadFile(file, onProgress) {
    // Simulate file upload progress
    const total = file.size;
    for (let percent = 0; percent <= 100; percent++) {
      onProgress({ total, loaded: (total * percent) / 100 });
      await new Promise((r) => setTimeout(r, 20));
    }

    return {
      fileId: "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
    };
  }
};

function generateDownloadUrl(content: string): string {
  return `data:text/plain;charset=utf-8;base64,${btoa(content)}`;
}
