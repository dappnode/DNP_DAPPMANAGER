import { expect } from "chai";
import { ComposeEditor, parseServiceNetworks } from "../../src/index.js";

describe("modules / compose / networks", () => {
  describe("parseServiceNetworks", () => {
    const testCases: {
      id: string;
      from: Parameters<typeof parseServiceNetworks>[0];
      to: ReturnType<typeof parseServiceNetworks>;
    }[] = [
      { id: "Empty array", from: [], to: {} },
      { id: "Empty obj", from: {}, to: {} },
      {
        id: "From array to obj",
        from: ["dncore_network"],
        to: { dncore_network: {} },
      },
      {
        id: "Keep obj",
        from: { dncore_network: {} },
        to: { dncore_network: {} },
      },
    ];

    for (const { id, from, to } of testCases) {
      it(id, () => {
        expect(parseServiceNetworks(from)).to.deep.equal(to);
      });
    }
  });

  describe("Edit networks", () => {
    it("Add and remove a network", () => {
      const serviceName = "sample.dnp.dappnode.eth";
      const container_name = "Container-sample.dnp.dappnode.eth";
      const image = "image-sample.dnp.dappnode.eth";

      const networkName = "dncore_network";
      const aliases = ["sample-alias"];

      const compose = new ComposeEditor({
        version: "3.5",
        services: {
          [serviceName]: { container_name, image },
        },
      });

      compose.firstService().addNetwork(networkName, { aliases });
      console.log(compose.output());
      expect(compose.output()).to.deep.equal({
        version: "3.5",
        services: {
          "sample.dnp.dappnode.eth": {
            container_name,
            image,
            networks: {
              [networkName]: { aliases },
            },
            dns: undefined,
          },
        },
        networks: {
          [networkName]: { external: true },
        },
      });

      compose.firstService().removeNetwork(networkName);
      console.log(compose.output());
      expect(compose.output()).to.deep.equal({
        version: "3.5",
        services: {
          "sample.dnp.dappnode.eth": {
            container_name,
            image,
            dns: undefined,
          },
        },
        networks: {},
      });
    });
  });
});
