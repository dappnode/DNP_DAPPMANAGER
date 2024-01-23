export async function addDappnodePeerToLocalIpfsNode() {
  const IpfsPeer =
    "/ip4/167.86.114.131/tcp/4001/p2p/QmfB6dT5zxUq1BXiXisgcZKYkvjywdDYBK5keRaqDKH633";
  const IpfsContainer = "DAppNodeCore-ipfs.dnp.dappnode.eth";

  const response = await fetch(
    `http://172.33.0.7:5001/api/v0/swarm/peering/add?arg=${IpfsPeer}`,
    {
      method: "POST",
    }
  );
  return response;
}
