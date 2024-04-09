import { logs } from "@dappnode/logger";

//Adds Dappnode IPFS peers to the local IPFS node for more stability when fetching IPFS content
export async function addDappnodePeerToIpfsNodes() {
  const nodesIps = [
    "167.86.114.131", //local node
    "65.109.51.31", //production node
  ];

  const ipfsAlias = "ipfs.dappnode";
  const dappnodeIpfsPeer = (ipfsNodeIp: string) =>
    `/ip4/${ipfsNodeIp}/tcp/4001/p2p/QmfB6dT5zxUq1BXiXisgcZKYkvjywdDYBK5keRaqDKH633`;

  // forEach node adding
  nodesIps.forEach(async (node) => {
    logs.info(`adding dappnode peer to ipfs node: ${node}`);
    await fetch(
      `http://${ipfsAlias}:5001/api/v0/swarm/peering/add?arg=${dappnodeIpfsPeer(
        node
      )}`,
      {
        method: "POST",
      }
    );
  });
}
