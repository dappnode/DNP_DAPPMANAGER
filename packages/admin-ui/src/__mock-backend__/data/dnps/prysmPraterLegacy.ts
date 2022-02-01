import { MockDnp, PortProtocol } from "./types";

// There should be shown in the mock UI the eth2migration option for the prysm prater package

const dnpName = "prysm-prater.dnp.dappnode.eth";
const serviceNames = {
  beaconChain: "beacon-chain",
  validator: "validator"
};
const serviceName = dnpName;

export const prysmPraterLegacy: MockDnp = {
  avatar: "",

  metadata: {
    name: dnpName,
    version: "0.1.7",
    upstreamVersion: "v2.0.6",
    description:
      "Validate with prysm: a Go implementation of the Ethereum 2.0 Serenity protocol and open source project created by Prysmatic Labs. Beacon node which powers the beacon chain at the core of Ethereum 2.0\n\nIt includes a Grafana dashboard for the [DMS](http://my.dappnode/#/installer/dms.dnp.dappnode.eth) thanks to the amazing work of [metanull-operator](https://github.com/metanull-operator/eth2-grafana)",
    type: "service",
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [
      "Abel Boldú (@vdo)",
      "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)"
    ],
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
      bitcoin_data: "",
      bitcoin_data_old: "/dev0/data",
      bitcoin_data_old_legacy: "legacy:/dev1/data"
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

  installedContainers: {
    [serviceNames.beaconChain]: {
      state: "running",
      running: true,
      ports: [
        {
          container: 8088,
          host: 8088,
          protocol: PortProtocol.TCP
        }
      ],
      volumes: [
        {
          name: "prysm-praterdnpdappnodeeth_beacon-chain-data",
          host: "data",
          container: "./data/ethereum"
        }
      ]
    },
    [serviceNames.validator]: {
      state: "running",
      running: true,
      ports: [
        {
          container: 7009,
          host: 7009,
          protocol: PortProtocol.TCP
        }
      ],
      volumes: [
        {
          name: "prysm-praterdnpdappnodeeth_validator-data",
          host: "data",
          container: "./data/ethereum"
        }
      ]
    }
  },

  installedData: {
    backup: [
      {
        name: "data",
        path: "/data"
      }
    ],
    updateAvailable: {
      newVersion: "1.0.0",
      upstreamVersion: "v0.2.8"
    }
  }
};
