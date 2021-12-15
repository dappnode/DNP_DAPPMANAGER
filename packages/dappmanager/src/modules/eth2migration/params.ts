export const eth2migrationParams = {
  mainnet: {
    dnpName: "prysm.dnp.dappnode.eth",
    validatorContainerName: "DAppNodePackage-validator.prysm.dnp.dappnode.eth"
  },
  testnet: {
    dnpName: "prater.dnp.dappnode.eth",
    validatorContainerName:
      "DAppNodePackage-validator.prysm-prater.dnp.dappnode.eth"
  },
  keys: {
    walletDir: "/root/.eth2validators",
    walletPasswordFile: "/root/.eth2validators/walletpassword.txt",
    backupKeysDir: "/root",
    backupKeysFile: "/root/backup.zip"
  },
  slashingData: {
    slashingProtectionFile: "/root/.eth2validators/direct/validator.db"
  }
};

export type Eth2Network = "prater" | "mainnet";
