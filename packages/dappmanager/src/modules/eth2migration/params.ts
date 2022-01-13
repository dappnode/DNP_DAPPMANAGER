export const eth2migrationParams = {
  dappnodeDomain: ".dnp.dappnode.eth",
  dappnodePackagePrefix: "DAppNodePackage-",
  backup: {
    backupDir: "/root",
    backupKeysFile: "/root/backup.zip",
    backupSlashingProtectionFile: "/root/slashing_protection.json",
    backupWalletPasswordFile: "/root/walletpassword.txt",
    backupFiles: [
      "backup.zip",
      "walletpassword.txt",
      "slashing_protection.json"
    ]
  },
  keys: {
    walletDir: "/root/.eth2validators",
    walletPasswordFile: "/root/.eth2validators/walletpassword.txt"
  },
  slashingData: {
    slashingProtectionFile: "/root/.eth2validators/direct/validator.db"
  }
};

export type Eth2Network = "prater" | "mainnet";

export type Eth2Client = "prysm" | "teku" | "lighthouse";
