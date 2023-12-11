import { ethers } from "ethers";
import { params } from "@dappnode/params";
import fetch from "node-fetch";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";

const dyndnsHost = params.DYNDNS_HOST;

/**
 * Gets the keys from the local file or creates new ones and stores them.
 * Then it does a GET request to the dyndns server to update the record
 *
 * @returns the domain, from the server.
 * Example: 1234abcd1234acbd.dyndns.dappnode.io
 */
export async function updateDyndnsIp(): Promise<string | void> {
  const privateKey = db.dyndnsIdentity.get().privateKey;
  if (!privateKey) {
    logs.warn("dyndns: Private key not initialized");
    return;
  }
  return await updateDyndnsIpFromPrivateKey(privateKey);
}

export async function updateDyndnsIpFromPrivateKey(
  privateKey: string
): Promise<string | void> {
  // privateKey must be 64 chars length otherwise it will raise with the error
  // Error: 400, Signing error: Expected signature to be an Uint8Array with length 64
  // Server side error: https://github.com/dappnode/dyndns-server/blob/7fde48fb19c7d7c19bfb43cac6d56dcc7116d32b/api/src/server.js#L64
  // TODO: consider bumping server side libs eth-crypto
  //if (privateKey.startsWith("0x")) privateKey = privateKey.slice(2);

  const timestamp = Math.floor(Date.now() / 1000);

  // Using ethers as a raw signer (without '\x19Ethereum Signed Message:\n' prefix) to mimic previous EthCrypto signature
  const wallet = new ethers.Wallet(privateKey);
  const signingKey = new ethers.SigningKey(privateKey);
  const signDigest = signingKey.sign.bind(signingKey);
  const hash = ethers.solidityPackedKeccak256(
    ["string"],
    [timestamp.toString()]
  );
  const signature = ethers.Signature.from(signDigest(hash));
  // create a uint8array from the ethers signature

  const res = await fetch(
    `${dyndnsHost}/?${[
      `address=${wallet.address}`,
      `timestamp=${timestamp}`,
      `sig=${signature}`,
    ].join("&")}`
  );

  if (res.status !== 200) {
    // TODO: do better type checking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyError: { message: string } = (await res.json()) as any;
    throw Error(`${res.status}, ${bodyError.message}`);
  }

  // TODO: do better type checking
  const bodyData: {
    ip: string;
    domain: string;
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = (await res.json()) as any;

  // Deal with the answer
  // Sample res:
  // res.data = {
  //     'ip': '63.84.220.164',
  //     'domain': '1234abcd1234acbd.dyndns.dappnode.io',
  //     'message': 'Your dynamic domain 1234abcd1234acbd.dyndns.dappnode.io
  //          has been updated to 63.11.22.164',
  // };

  logs.info(`dyndns: Updated IP successfully: ${bodyData.message}`);
  db.domain.set(bodyData.domain);
  return bodyData.domain;
}
