import { ethers } from "ethers";
import { params } from "@dappnode/params";

export function prepareMessageFromPackage({
  packageEnsName,
  data
}: {
  packageEnsName: string;
  data: string;
}): string {
  // Adding a custom prefix to signature to prevent signing arbitrary data.
  // See https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
  return (
    params.SIGNATURE_PREFIX +
    "\n" +
    packageEnsName +
    "\n" +
    data.length +
    "\n" +
    data
  );
}

export function hashMessage(message: string): string {
  return ethers.utils.solidityKeccak256(["string"], [message]);
}

export function signDataFromPackage({
  privateKey,
  packageEnsName,
  data
}: {
  privateKey: string;
  packageEnsName: string;
  data: string;
}): string {
  const message = prepareMessageFromPackage({ packageEnsName, data });
  const hash = hashMessage(message);

  // Using ethers as a raw signer (without '\x19Ethereum Signed Message:\n' prefix)
  // to mimic previous EthCrypto signature
  const signingKey = new ethers.utils.SigningKey(privateKey);
  return ethers.utils.joinSignature(signingKey.signDigest(hash));
}

export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}
