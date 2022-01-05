export const eth2migrationParams = {
  mainnet: {
    signerDnpName: "web3signer.dnp.dappnode.eth",
    clientDnpName: "prysm.dnp.dappnode.eth",
    validatorContainerName: "DAppNodePackage-validator.prysm.dnp.dappnode.eth"
  },
  testnet: {
    signerDnpName: "web3signer-prater.dnp.dappnode.eth",
    clientDnpName: "prater.dnp.dappnode.eth",
    validatorContainerName:
      "DAppNodePackage-validator.prysm-prater.dnp.dappnode.eth"
  },
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

export interface ValidatorFiles {
  validatorKeystore: string;
  walletPassword: string;
  slashingProtection: string;
}
