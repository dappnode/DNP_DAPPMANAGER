import { logs } from "@dappnode/logger";

export async function addDappnodePeerToLocalIpfsNode() {
  const IpfsPeer =
    "/ip4/167.86.114.131/tcp/4001/p2p/QmfB6dT5zxUq1BXiXisgcZKYkvjywdDYBK5keRaqDKH633";
  const IpfsAlias = "ipfs.dappnode";

  logs.info("adding dappnode peer to local ipfs node");
  await fetch(
    `http://${IpfsAlias}:5001/api/v0/swarm/peering/add?arg=${IpfsPeer}`,
    {
      method: "POST",
    }
  );
}
