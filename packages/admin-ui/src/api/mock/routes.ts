import { IApiRoutes } from "api/interface";
import newTabProps from "utils/newTabProps";
import { runMockFullBackup } from "../../__mock-backend__/fullBackup";

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

  async createFullBackup({ adminPassword, keepValidatorsStopped, skipValidatorData }) {
    await new Promise((r) => setTimeout(r, 500));
    if (adminPassword !== "dappnode") throw Error("WRONG_CREDENTIALS");
    await runMockFullBackup();
    return {
      fileId: "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc",
      fileName: "dappnode-backup-2026-11-23T10-15-00Z-1a2b.dnbackup",
      sizeBytes: 1843200,
      warnings: ['rotki.dnp.dappnode.eth: could not back up "logs": path /data/logs does not exist'],
      stoppedValidators: keepValidatorsStopped ? ["web3signer.dnp.dappnode.eth"] : [],
      skippedValidators: skipValidatorData ? ["web3signer.dnp.dappnode.eth"] : []
    };
  },

  async inspectFullBackup({ password }) {
    await new Promise((r) => setTimeout(r, 800));
    if (password.length < 10) throw Error("Wrong password or corrupted backup file");
    const pkg = (
      dnpName: string,
      action: "install" | "update" | "apply-settings" | "keep-newer" | "skip" | "remove",
      backupVersion: string | null,
      installedVersion: string | null,
      extra: { restoreData?: boolean; validator?: boolean; isCore?: boolean; reason?: string } = {}
    ) => ({
      dnpName,
      action,
      backupVersion,
      installedVersion,
      isCore: extra.isCore ?? false,
      restoreData: extra.restoreData ?? false,
      validator: extra.validator ?? false,
      reason: extra.reason
    });
    const warnings = ["geth.dnp.dappnode.eth: its data was not in the backup, only its configuration is restored"];
    return {
      createdAt: "2026-11-20T09:12:00.000Z",
      dappmanagerVersion: "0.2.95",
      arch: "x64",
      packageCount: 6,
      blockers: [],
      requiresValidatorConfirmation: true,
      suggestedMode: "merge",
      plans: {
        merge: {
          mode: "merge",
          restoresIdentity: false,
          restoresAdminLogin: false,
          restoresSystemSettings: false,
          warnings,
          packages: [
            pkg("dappmanager.dnp.dappnode.eth", "skip", "0.2.95", "0.2.95", {
              isCore: true,
              reason: "The dappmanager restores its own settings and is not reinstalled"
            }),
            pkg("wifi.dnp.dappnode.eth", "skip", "0.2.9", "0.2.9", {
              isCore: true,
              reason: "System package, kept as configured on this node"
            }),
            pkg("geth.dnp.dappnode.eth", "keep-newer", "1.14.0", "1.15.0", {
              reason: "This node runs a newer version (1.15.0); its data is kept"
            }),
            pkg("rotki.dnp.dappnode.eth", "install", "1.3.0", null, { restoreData: true }),
            pkg("lighthouse.dnp.dappnode.eth", "apply-settings", "5.1.0", "5.1.0"),
            pkg("web3signer.dnp.dappnode.eth", "install", "2.1.0", null, { restoreData: true, validator: true })
          ]
        },
        clone: {
          mode: "clone",
          restoresIdentity: true,
          restoresAdminLogin: true,
          restoresSystemSettings: true,
          warnings,
          packages: [
            pkg("dappmanager.dnp.dappnode.eth", "skip", "0.2.95", "0.2.95", {
              isCore: true,
              reason: "The dappmanager restores its own settings and is not reinstalled"
            }),
            pkg("wifi.dnp.dappnode.eth", "apply-settings", "0.2.9", "0.2.9", { isCore: true }),
            pkg("geth.dnp.dappnode.eth", "keep-newer", "1.14.0", "1.15.0", {
              reason: "This node runs a newer version (1.15.0); its data is kept"
            }),
            pkg("rotki.dnp.dappnode.eth", "install", "1.3.0", null, { restoreData: true }),
            pkg("lighthouse.dnp.dappnode.eth", "apply-settings", "5.1.0", "5.1.0", { restoreData: true }),
            pkg("web3signer.dnp.dappnode.eth", "install", "2.1.0", null, { restoreData: true, validator: true }),
            pkg("ipfs-pinner.dnp.dappnode.eth", "remove", null, "0.1.0", {
              reason: "Not in the backup. Its volumes are kept"
            })
          ]
        }
      }
    };
  },

  async restoreFullBackup({ adminPassword }) {
    await new Promise((r) => setTimeout(r, 800));
    if (adminPassword !== "dappnode") throw Error("WRONG_CREDENTIALS");
    return { ok: true };
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
