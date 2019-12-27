import EthCrypto from "eth-crypto";
import fs from "fs";
import params from "../params";

const privateKeyPath = params.PRIVATE_KEY_PATH;

export default function signWithPrivateKey(data: string): string {
  if (!fs.existsSync(privateKeyPath))
    throw Error(`Private key not found at: ${privateKeyPath}`);
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");

  // Adding a custom prefix to signature to prevent signing arbitrary data.
  // See https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
  return EthCrypto.sign(
    privateKey,
    EthCrypto.hash.keccak256(
      params.SIGNATURE_PREFIX + String(data.length) + data
    )
  );
}
