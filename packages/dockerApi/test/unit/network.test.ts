// getDnCoreNetworkConfig.test.js
import { expect } from "chai";
import { getDnCoreNetworkContainerConfig } from "../../src/index.js";

// This test will only work if you have a running dappmanager container with DN_CORE network
describe("get DN_CORE network config", () => {
  // Test case: Should return the correct alias information when the network exists
  it("should return a 'not null' docker network when calling with dappmanager container", async () => {
    // Set dappmanager container name
    const containerName = "DAppNodeCore-dappmanager.dnp.dappnode.eth";

    // Mock the dockerContainerInspect function
    const result = await getDnCoreNetworkContainerConfig(containerName);
    expect(result).to.not.be.null;

    // "result" looks like:
    // const mockNetwork = {
    //   IPAMConfig: { IPv4Address: '172.33.1.7' },
    //   Links: null,
    //   Aliases: [
    //     'DAppNodeCore-dappmanager.dnp.dappnode.eth',
    //     'dappmanager.dnp.dappnode.eth',
    //     'dappmanager.dappnode',
    //     'd6a8fb11b1a4'
    //   ],
    //   NetworkID: '8997fa230b182a0f75d331acf04dca440eb948af8d39966baab02f5ae0a3f566',
    //   EndpointID: '2b3728a7d08b5e41da432bcac054e366d6c88def3bfac12749b87c37eae98836',
    //   Gateway: '172.33.0.1',
    //   IPAddress: '172.33.1.7',
    //   IPPrefixLen: 16,
    //   IPv6Gateway: '',
    //   GlobalIPv6Address: '',
    //   GlobalIPv6PrefixLen: 0,
    //   MacAddress: '02:42:ac:21:01:07',
    //   DriverOpts: null
    // };
  });
});
