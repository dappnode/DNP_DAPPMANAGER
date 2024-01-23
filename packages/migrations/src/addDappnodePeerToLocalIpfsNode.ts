import { logs } from "@dappnode/logger";

//Adds Dappnode IPFS peer to the local IPFS node for more stability when fetching IPFS content
export async function addDappnodePeerToLocalIpfsNode() {
  const dappnodeIpfsPeer =
    "/ip4/167.86.114.131/tcp/4001/p2p/QmfB6dT5zxUq1BXiXisgcZKYkvjywdDYBK5keRaqDKH633";
  const ipfsAlias = "ipfs.dappnode";

  logs.info("adding dappnode peer to local ipfs node");
  await fetch(
    `http://${ipfsAlias}:5001/api/v0/swarm/peering/add?arg=${dappnodeIpfsPeer}`,
    {
      method: "POST",
    }
  );
}
