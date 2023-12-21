import "mocha";
import { expect } from "chai";
import { getDockerNetworkNameFromSubnet } from "../../../src/ensureDockerNetworkConfig/getDockerNetworkNameFromSubnet.js";
import { docker } from "@dappnode/dockerapi";

describe("getDockerNetworkNameFromSubnet", () => {
  const dockerNetworkName = "dncore_test";
  const dockerNetworkSubnet = "172.30.0.0/16";

  before(async () => {
    await docker.createNetwork({
      Name: dockerNetworkName,
      Driver: "bridge",
      IPAM: {
        Driver: "default",
        Config: [
          {
            Subnet: dockerNetworkSubnet,
          },
        ],
      },
    });
  });

  it("should get a docker network from a docker subnet", async () => {
    const dockerNetworkNameResult = await getDockerNetworkNameFromSubnet(
      dockerNetworkSubnet
    );
    expect(dockerNetworkNameResult).to.deep.equal(dockerNetworkName);
  });

  after(async () => {
    // remove docker network
    await docker.getNetwork(dockerNetworkName).remove();
  });
});
