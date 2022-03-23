import { MockDnp } from "./types";

const dnpName = "prysm-prater.dnp.dappnode.eth";
const serviceName = dnpName;

export const prysmPrater: MockDnp = {
  avatar:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc0uvhOkPYQD-YJ-EJLCwd5JMrkxuFKl6DcBeajD4JYAuk5n0&s",

  metadata: {
    name: dnpName,
    version: "0.1.7",
    description: `Validate with prysm: a Go implementation of the Ethereum 2.0 Serenity protocol and open source project created by Prysmatic Labs.
Beacon node which powers the beacon chain at the core of Ethereum 2.0\n\nIt includes a Grafana dashboard for the [DMS](http://my.dappnode/#/installer/dms.dnp.dappnode.eth) thanks to the amazing work of [metanull-operator](https://github.com/metanull-operator/eth2-grafana)
`,
    type: "service",
    style: {
      featuredBackground: "linear-gradient(to right, #4b3317, #cb6e00)",
      featuredColor: "white"
    },
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [
      "Abel Boldú (@vdo)",
      "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
      "Loco del Bitcoin <ellocodelbitcoin@gmail.com>"
    ],
    keywords: ["bitcoin", "btc"],
    // @ts-ignore
    homepage: {
      homepage:
        "https://github.com/dappnode/DAppNodePackage-prysm-prater#readme"
    },
    repository: {
      type: "git",
      url: "git+https://github.com/dappnode/DAppNodePackage-prysm-prater.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-prysm-prater/issues"
    },
    license: "GPL-3.0"
  },

  userSettings: {
    portMappings: { [serviceName]: { "8333": "8333" } },
    namedVolumeMountpoints: {
      prysm_prater_data: "",
      prysm_prater_data_old: "/dev0/data",
      prysm_prater_data_old_legacy: "legacy:/dev1/data"
    },
    environment: {
      [serviceName]: {
        BTC_RPCUSER: "dappnode",
        BTC_RPCPASSWORD: "dappnode",
        BTC_TXINDEX: "1",
        BTC_PRUNE: "0"
      }
    }
  },

  setupWizard: {
    version: "2",
    fields: [
      {
        id: "GRAFFITI",
        target: {
          type: "environment",
          name: "GRAFFITI",
          service: "validator"
        },
        title: "Graffiti",
        description:
          "Add a string to your proposed blocks, which will be seen on the block explorer"
      },
      {
        id: "HTTP_WEB3PROVIDER",
        target: {
          type: "environment",
          name: "HTTP_WEB3PROVIDER",
          service: "beacon-chain"
        },
        title: "Eth1.x node URL",
        description: "URL to the Eth1.x node need for the Beacon chain."
      }
    ]
  },

  installedData: {
    backup: [
      {
        name: "data",
        path: "/data"
      }
    ],
    updateAvailable: {
      newVersion: "1.0.1",
      upstreamVersion: "v2.0.6"
    }
  }
};
