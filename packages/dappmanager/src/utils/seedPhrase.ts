import fs from "fs";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { utils as ethersUtils } from "ethers";

const privateKeyPath = params.PRIVATE_KEY_PATH;
const standardEthereumDerivationPath = "m/44'/60'/0'/0/0";

interface EthereumKeys {
  privateKey: string;
  publicKey: string;
  address: string;
}

export function seedToPrivateKey(seedPhrase: string): EthereumKeys {
  const seedPhraseArray = seedPhrase.trim().split(/\s+/g);
  if (seedPhraseArray.length !== 12)
    throw Error("seed phrase must contain exactly 12 words");
  const correctedSeedPhrase = seedPhraseArray.join(" ");

  const masterNode = ethersUtils.HDNode.fromMnemonic(correctedSeedPhrase);
  const { privateKey, publicKey, address } = masterNode.derivePath(
    standardEthereumDerivationPath
  );
  return {
    privateKey,
    publicKey,
    address
  };
}

export function storePrivateKeyFromSeed(seedPhrase: string): void {
  const keys = seedToPrivateKey(seedPhrase);
  storePrivateKey(keys);
}

function storePrivateKey(keys: EthereumKeys): void {
  fs.writeFileSync(privateKeyPath, keys.privateKey);
  db.identityAddress.set(keys.address);
}
