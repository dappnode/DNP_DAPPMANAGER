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
      slashingProtectionExported: keepValidatorsStopped
        ? [{ dnpName: "web3signer.dnp.dappnode.eth", validatorCount: 4 }]
        : [],
      skippedValidators: skipValidatorData ? ["web3signer.dnp.dappnode.eth"] : []
    };
  },

  fullBackupPendingUrl({ fileName }) {
    return generateDownloadUrl(`Sample backup ${fileName}`);
  },

  async inspectFullBackup({ password }) {
    await new Promise((r) => setTimeout(r, 800));
    if (password.length < 10) throw Error("Wrong password or corrupted backup file");
    const pkg = (
      dnpName: string,
      action: "install" | "update" | "apply-settings" | "keep-newer" | "skip" | "remove",
      backupVersion: string | null,
      installedVersion: string | null,
      extra: {
        restoreData?: boolean;
        dataSelectable?: boolean;
        validator?: boolean;
        isCore?: boolean;
        reason?: string;
        slashingProtection?: "included" | "missing";
        validatorKeyCount?: number;
      } = {}
    ) => ({
      dnpName,
      action,
      backupVersion,
      installedVersion,
      isCore: extra.isCore ?? false,
      restoreData: extra.restoreData ?? false,
      dataSelectable: extra.dataSelectable,
      validator: extra.validator ?? false,
      slashingProtection: extra.slashingProtection,
      validatorKeyCount: extra.validatorKeyCount,
      reason: extra.reason
    });
    // A backup made while moving the node: one Web3Signer with its exact
    // slashing protection, one from an older routine backup without it
    const web3signerMainnet = {
      restoreData: true,
      validator: true,
      slashingProtection: "included" as const,
      validatorKeyCount: 4,
      reason:
        "Its 4 validator keys are imported through the Staking Brain with the exact slashing protection from the backup, then it is stopped"
    };
    const web3signerHoodi = { restoreData: true, validator: true, slashingProtection: "missing" as const };
    const warnings = [
      "Only the configuration is restored, the data was not in the backup: geth",
      'web3signer-hoodi.dnp.dappnode.eth: this backup has no slashing protection for its validators (it was not made with "I am moving or reinstalling this Dappnode"). Their keys are restored and the package stays stopped: start it only after the old node has been off for at least 2 epochs (about 13 minutes on Ethereum), or with doppelganger protection enabled in your consensus client.'
    ];
    return {
      createdAt: "2026-11-20T09:12:00.000Z",
      dappmanagerVersion: "0.2.95",
      arch: "x64",
      packageCount: 7,
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
            pkg("rotki.dnp.dappnode.eth", "install", "1.3.0", null, { restoreData: true, dataSelectable: true }),
            pkg("lighthouse.dnp.dappnode.eth", "apply-settings", "5.1.0", "5.1.0", {
              validator: true,
              dataSelectable: true
            }),
            pkg("web3signer.dnp.dappnode.eth", "install", "2.1.0", null, web3signerMainnet),
            pkg("web3signer-hoodi.dnp.dappnode.eth", "install", "0.1.5", null, {
              ...web3signerHoodi,
              dataSelectable: true
            })
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
            pkg("web3signer.dnp.dappnode.eth", "install", "2.1.0", null, web3signerMainnet),
            pkg("web3signer-hoodi.dnp.dappnode.eth", "install", "0.1.5", null, web3signerHoodi),
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
