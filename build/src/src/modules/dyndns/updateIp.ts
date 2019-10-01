import EthCrypto from "eth-crypto";
import params from "../../params";
import fetch from "node-fetch";
import * as db from "../../db";
import Logs from "../../logs";
const logs = Logs(module);

const dyndnsHost = params.DYNDNS_HOST;

/**
 * EthCrypto reference
 *
 * - Create private key
 * const identity = EthCrypto.createIdentity();
 * {
      address: '0x3f243FdacE01Cfd9719f7359c94BA11361f32471',
      privateKey: '0x107be9...',
      publicKey: 'bf1cc315...'
  }
 *
 * - From private key to public key
 * const publicKey = EthCrypto.publicKeyByPrivateKey('0x107be9...);
 * - Publick key to address
 * const address = EthCrypto.publicKey.toAddress('bf1cc315...);
 *
 * - Sign message
 * const message = 'foobar';
   const messageHash = EthCrypto.hash.keccak256(message);
   const signature = EthCrypto.sign(privateKey, messageHash);
 */

/**
 * Gets the keys from the local file or creates new ones and stores them.
 * Then it does a GET request to the dyndns server to update the record
 *
 * @return {String} the domain, from the server.
 * Example: 1234abcd1234acbd.dyndns.dappnode.io
 *
 */
export default async function updateIp(): Promise<string | void> {
  const privateKey = db.dyndnsIdentity.get().privateKey;
  if (!privateKey) {
    logs.warn("dyndns: Private key not initialized");
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const messageHash = EthCrypto.hash.keccak256(timestamp.toString());
  const signature = EthCrypto.sign(privateKey, messageHash);
  const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
  const address = EthCrypto.publicKey.toAddress(publicKey);

  const parameters = [
    `address=${address}`,
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
    logs.error(`Dyndns error: ${e.stack || e.message}`);
  }
}
