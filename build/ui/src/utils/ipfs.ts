import { ipfsApiUrl } from "pages/system/data";
import { stringIncludes } from "./strings";

/**
 * @param peer = "/dns4/1bc3641738cbe2b1.dyndns.dappnode.io/tcp/4001/ipfs/QmWAcZZCvqVnJ6J9946qxEMaAbkUj6FiiVWakizVKfnfDL"
 */
export async function addSwarmConnection(peer: string) {
  const res = await ipfsApi<{ Type: string; Message: string }>(
    `swarm/connect?arg=${peer}`
  );
  if (res.Type === "error") {
    console.error(`Error on addSwarmConnection:`, res);
    if (stringIncludes(res.Message, "dial attempt failed"))
      throw Error("Can't connect to peer");
    else if (stringIncludes(res.Message, "dial to self attempt"))
      throw Error("You can't add yourself");
    else throw Error(res.Message);
  }
}

/**
 * curl "http://ipfs.dappnode:5001/api/v0/bootstrap/add?arg=/dnsaddr/bacd1234acdb1234.dyndns.dappnode.io/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap"
 * {
 *   "Peers":[ "/dnsaddr/bacd1234acdb1234.dyndns.dappnode.io/tcp/4001/ipfs/QmWAcZZCvqVnJ6J9946qxEMaAbkUj6FiiVWakizVKfnfDL" ]
 * }
 *
 * Multiaddress possible prefixes:
 * - /ip4/
 * - /dns4/
 * - /dnsaddr/
 *
 * @param peer = "/dns4/1bc3641738cbe2b1.dyndns.dappnode.io/tcp/4001/ipfs/QmWAcZZCvqVnJ6J9946qxEMaAbkUj6FiiVWakizVKfnfDL"
 */
export async function addBootstrap(peer: string) {
  const res = await ipfsApi<{ Peers: string[] }>(`bootstrap/add?arg=${peer}`);
  if (!(res.Peers || []).includes(peer)) {
    console.error(`Error on addBootstrap:`, res);
    throw Error(`Error adding bootstrap node`);
  }
}

/**
 * curl "http://ipfs.dappnode:5001/api/v0/id"
 * {
 *   ID: "QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap",
 *   PublicKey: "AsDFGHJkKjHGfDsQwErTyUiKNDsdFGhjKkJhGFdSeRtYUiJhFDsdfGHjIGcG/bGeEo3+BYjFkjMLor/thjk8wq4chVNCj+VH8RuKzQrkCJr++1i3NFHpJaRsy0zuXPWRJcO2sRVJn6ZMUG1lM/cFlpBpb3VSj1AFeoIXec547Bz36Q7AQdKWxwskRBJ1gCo0unJ4lsBBongstuywTtPReLbki+jb3OgOwcfiRM/uq/kP0bq6rBzLRx0d5cYIo4cQdoN4IaL/99TEKji/sLOPZEQdzYq0UV6yk3uTpza9pq1kL6Nd4obY6F1QW7BUw/vunxHMThtD+j1+5M84FHLFWjRaoOnhJ6PLLzM0f40FOOvLUzdwdDm4eBXBjUZpWUO+mpoOAkwxAgMBAAE=",
 *   Addresses: [
 *     "/ip4/127.0.0.1/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap",
 *     "/ip4/172.33.1.5/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap",
 *     "/ip4/85.200.85.20/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap"
 *   ],
 *   AgentVersion: "go-ipfs/0.4.20/8efc82534",
 *   ProtocolVersion: "ipfs/0.1.0"
 * }
 *
 * curl "http://ipfs.dappnode:5001/api/v0/bootstrap/add?arg=/dnsaddr/bacd1234acdb1234.dyndns.dappnode.io/tcp/4001/ipfs/QmWasdappdappdapptyuioasdfghjqwertyuiasdfghjdap"
 * {
 *   "Peers":[ "/dnsaddr/bacd1234acdb1234.dyndns.dappnode.io/tcp/4001/ipfs/QmWAcZZCvqVnJ6J9946qxEMaAbkUj6FiiVWakizVKfnfDL" ]
 * }
 *
 * Multiaddress possible prefixes:
 * - /ip4/
 * - /dns4/
 * - /dnsaddr/
 */
export async function getId(): Promise<{ ID: string }> {
  return await ipfsApi<{ ID: string }>(`id`);
}

/**
 * Fetch JSON data
 * @param apiPath
 */
async function ipfsApi<R>(apiPath: string): Promise<R> {
  const res = await fetch(`${ipfsApiUrl}/${apiPath}`, { method: "POST" });
  if (!res.ok) throw Error(`${res.status} ${res.statusText}`);
  return await res.json();
}
