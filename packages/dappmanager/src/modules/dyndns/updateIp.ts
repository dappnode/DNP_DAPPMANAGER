import { ethers } from "ethers";
import { params } from "@dappnode/params";
import fetch from "node-fetch";
import * as db from "../../db/index.js";
import { logs } from "@dappnode/logger";

const dyndnsHost = params.DYNDNS_HOST;

/**
 * Gets the keys from the local file or creates new ones and stores them.
 * Then it does a GET request to the dyndns server to update the record
 *
 * @returns the domain, from the server.
 * Example: 1234abcd1234acbd.dyndns.dappnode.io
 */
export default async function updateIp(): Promise<string | void> {
  const privateKey = db.dyndnsIdentity.get().privateKey;
  if (!privateKey) {
    logs.warn("dyndns: Private key not initialized");
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Using ethers as a raw signer (without '\x19Ethereum Signed Message:\n' prefix) to mimic previous EthCrypto signature
  const wallet = new ethers.Wallet(privateKey);
  const signingKey = new ethers.utils.SigningKey(privateKey);
  const signDigest = signingKey.signDigest.bind(signingKey);
  const hash = ethers.utils.solidityKeccak256(
    ["string"],
    [timestamp.toString()]
  );
  const signature = ethers.utils.joinSignature(signDigest(hash));
  const parameters = [
    `address=${wallet.address}`,
    `timestamp=${timestamp}`,
    `sig=${signature}`
  ];
  const url = `${dyndnsHost}/?${parameters.join("&")}`;
  try {
    const res = await fetch(url);

    const status = res.status;
    if (status !== 200) {
      try {
        const bodyError: { message: string } = await res.json();
        throw Error(`${status}, ${bodyError.message}`);
      } catch (e) {
        throw Error(`${status}, ${res.statusText}`);
      }
    }

    const bodyData: {
      ip: string;
      domain: string;
      message: string;
    } = await res.json();

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
  } catch (e) {
    logs.error("Dyndns error", e);
  }
}
