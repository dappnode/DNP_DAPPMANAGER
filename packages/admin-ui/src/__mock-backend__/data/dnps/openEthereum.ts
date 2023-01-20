import { PortProtocol } from "@dappnode/common";
import { MockDnp } from "./types";

const dnpName = "open-ethereum.dnp.dappnode.eth";
const serviceName = dnpName;

export const openEthereum: MockDnp = {
  metadata: {
    name: dnpName,
    version: "0.2.6",
    description:
      "Dappnode package responsible for providing the Ethereum blockchain, based on Parity v2.5.8-stable",
    type: "dncore",
    chain: "ethereum",
    upstreamVersion: "v2.5.8-stable",
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [
      "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)"
    ],
    keywords: ["DAppNodeCore", "Parity", "Mainnet", "Ethereum"],
    links: {
      homepage: "https://your-project-homepage-or-docs.io"
    },
    license: "GLP-3.0"
  },

  installedData: {
    version: "0.2.6",

    canBeFullnode: true
  },
  installedContainers: {
    [serviceName]: {
      ports: [
        {
          host: 30303,
          container: 30303,
          protocol: PortProtocol.TCP
        },
        {
          host: 30303,
          container: 30303,
          protocol: PortProtocol.UDP
        }
      ],
      volumes: [
        {
          host: "/var/lib/docker/volumes/paritydnpdappnodeeth_data/_data",
          container: "/app/.parity",
          name: "paritydnpdappnodeeth_data"
        },
        {
          host: "/var/lib/docker/volumes/paritydnpdappnodeeth_geth/_data",
          container: "/root/.ethereum/",
          name: "paritydnpdappnodeeth_geth"
        }
      ]
    }
  }
};
