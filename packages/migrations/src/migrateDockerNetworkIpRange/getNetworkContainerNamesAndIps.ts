import Dockerode from "dockerode";

export async function getNetworkContainerNamesAndIps(
  network: Dockerode.Network
): Promise<{ name: string; ip: string }[]> {
  const containers = ((await network.inspect()) as Dockerode.NetworkInspectInfo)
    .Containers;

  // Should not happen
  if (!containers) return [];

  return Object.values(containers).map((c) => {
    return {
      name: c.Name,
      ip: c.IPv4Address,
    };
  });
}
