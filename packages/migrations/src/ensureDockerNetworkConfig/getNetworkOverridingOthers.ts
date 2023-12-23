import { disconnectAllContainersFromNetwork, docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";

export async function getNetworkOverridingOthers({
    networkName,
    networkSubnet,
}: {
    networkName: string;
    networkSubnet: string;
}): Promise<{ network: Dockerode.Network, isNetworkRecreated: boolean }> {

    const networkOptions: Dockerode.NetworkCreateOptions = {
        Name: networkName,
        Driver: "bridge",
        IPAM: {
            Driver: "default",
            Config: [
                {
                    Subnet: networkSubnet,
                },
            ],
        },
    };

    try {
        const dncoreNetwork = docker.getNetwork(networkName);

        logs.info(`docker network ${dncoreNetwork.id} exists`);

        if (await isSubnetCorrect({ network: dncoreNetwork, networkSubnet })) {
            logs.info(`docker network ${networkName} has correct subnet`);
            return { network: dncoreNetwork, isNetworkRecreated: false };
        } else {
            logs.warn(`docker network ${networkName} has incorrect subnet. Recreating it...`);
            await removeAnyNetworkOverlappingSubnet(networkSubnet);
            const network = await recreateDockerNetwork(dncoreNetwork, networkOptions);
            return { network, isNetworkRecreated: true };
        }

    } catch (e) {
        if (e.statusCode === 404) {
            // dncore_network does not exist, create it
            logs.warn(`docker network ${networkName} not found, creating it...`);

            await removeAnyNetworkOverlappingSubnet(networkSubnet);
            const network = await docker.createNetwork(networkOptions);
            return { network, isNetworkRecreated: true };

        } else {
            // TODO: What do we do here?
            throw e;
        }
    }

}

/**
 * Checks if the subnet of a network is the one we want
 */
async function isSubnetCorrect({
    network,
    networkSubnet,
}: {
    network: Dockerode.Network;
    networkSubnet: string;
}): Promise<boolean> {
    const networkInspect: Dockerode.NetworkInspectInfo = await network.inspect();

    const subnetConfig = networkInspect.IPAM?.Config?.[0];

    return subnetConfig?.Subnet === networkSubnet;
}

/**
 * Removes any network whose subnet overlaps with the one provided as argument
 * The error thrown when trying to create a network with an overlapping subnet is:
 * Error: (HTTP code 403) unexpected - Pool overlaps with other one on this address space
 */
async function removeAnyNetworkOverlappingSubnet(networkSubnet: string): Promise<void> {
    const networks = await docker.listNetworks();

    const overlappingNetworks = networks.filter((network) => isNetworkOverlappingSubnet(network, networkSubnet));

    logs.info(`Found ${overlappingNetworks.length} networks to remove (overlapping subnet)`);

    const removeNetworkTasks = overlappingNetworks.map((networkInfo) => {
        const networkName = networkInfo.Name;
        const network = docker.getNetwork(networkName);
        return network.remove();
    });

    await Promise.all(removeNetworkTasks);
}

function isNetworkOverlappingSubnet(network: Dockerode.NetworkInspectInfo, networkSubnet: string): boolean {
    // TODO: This only checks if the first subnet is the same, but it could be that the network has more than one subnet
    // TODO: The network could be different, but the subnets could overlap
    return network.IPAM?.Config?.[0]?.Subnet === networkSubnet;
}

/**
 * Recreates the docker network with the configuration defined in networkOptions
 *
 * @param dockerNetworkToRemove "" docker network to remove
 * @param dockerNewNetworkName "dncore_network"
 */
export async function recreateDockerNetwork(networkToRemove: Dockerode.Network, newNetworkOptions: Dockerode.NetworkCreateOptions): Promise<Dockerode.Network> {
    logs.info(`disconnecting all containers from ${networkToRemove.id}`);
    await disconnectAllContainersFromNetwork(networkToRemove);

    logs.info(`removing docker network ${networkToRemove.id}`);
    await networkToRemove.remove();

    // create network with valid range
    logs.info(
        `creating docker network ${newNetworkOptions.Name} with valid IP range`
    );

    return await docker.createNetwork(newNetworkOptions);
}