import { logs } from "@dappnode/logger";

interface IPFSnode {
  peer: string;
  gateway: string;
}

//Adds Dappnode IPFS peers to the IPFS nodes for more stability when fetching IPFS content
export async function addDappnodePeerToIpfsNodes() {
  const nodesIps: IPFSnode[] = [
    {
      peer: "QmfB6dT5zxUq1BXiXisgcZKYkvjywdDYBK5keRaqDKH633",
      gateway: "167.86.114.131",
    }, //remote - dev/testing node
    {
      peer: "12D3KooWLdrSru7LzYY4YDcfnJsrJeshTQooR2j38NkGvoj2yADp",
      gateway: "65.109.51.31",
    }, //remote - production node
  ];

  const ipfsAlias = "ipfs.dappnode";
  const dappnodeIpfsPeer = (node: IPFSnode) =>
    `/ip4/${node.gateway}/tcp/4001/p2p/${node.peer}`;

  // Adding peer for each node
  for (const node of nodesIps) {
    logs.info(`adding dappnode peer to ipfs node: ${node}`);
    await fetch(
      `http://${ipfsAlias}:5001/api/v0/swarm/peering/add?arg=${dappnodeIpfsPeer(
        node
      )}`,
      {
        method: "POST",
      }
    );
  }
}
