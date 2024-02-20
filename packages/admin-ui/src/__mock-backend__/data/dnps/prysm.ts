import { MockDnp } from "./types";

export const prysm: MockDnp = {
  avatar:
    "https://github.com/dappnode/DAppNodePackage-prysm/blob/main/avatar-prysm.png",

  manifest: {
    name: "prysm.dnp.dappnode.eth",
    version: "2.0.0",
    upstreamVersion: "v2.1.2",
    upstreamRepo: "prysmaticlabs/prysm",
    upstreamArg: "UPSTREAM_VERSION",
    shortDescription: "Prysm mainnet ETH2.0 Beacon chain + validator",
    description:
      "Validate with Prysm: a Go implementation of the Ethereum 2.0 Serenity protocol and open source project created by Prysmatic Labs.\n\nIt includes a Grafana dashboard for the [DMS](http://my.dappnode/installer/dms.dnp.dappnode.eth) thanks to the amazing work of [metanull-operator](https://github.com/metanull-operator/eth2-grafana)",
    type: "service",
    architectures: ["linux/amd64"],
    mainService: "validator",
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [
      "dappLion <dapplion@dappnode.io> (https://github.com/dapplion)"
    ],
    license: "GPL-3.0",
    repository: {
      type: "git",
      url: "git+https://github.com/dappnode/DAppNodePackage-prysm.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-prysm/issues"
    },
    requirements: {
      minimumDappnodeVersion: "0.2.57"
    },
    backup: [
      {
        name: "eth2validators",
        path: "/root/.eth2validators",
        service: "validator"
      }
    ],
    categories: ["Blockchain", "ETH2.0"],
    style: {
      featuredBackground: "linear-gradient(67deg, #16000c, #123939)",
      featuredColor: "white"
    },
    links: {
      ui: "http://prysm.dappnode/",
      homepage: "https://prysmaticlabs.com/",
      readme: "https://github.com/dappnode/DAppNodePackage-prysm",
      docs: "https://docs.prylabs.network/docs/getting-started"
    },
    dependencies: {
      "web3signer.dnp.dappnode.eth": "latest"
    },
    warnings: {
      onRemove:
        "Make sure your web3signer does not have this client selected or you will stop validating! (Packages > web3signer > config > client)"
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
        title: "Execution Client endpoint",
        description:
          "Consensus clients require access to an execution client. \n- Geth - `http://geth.dappnode:8545` - [Install link](http://my.dappnode/installer/geth.dnp.dappnode.eth)\n- Nethermind - `http://nethermind.public.dappnode:8545` - [Install link](http://my.dappnode/installer/nethermind.public.dappnode.eth)"
      },
      {
        id: "web3Backup",
        target: {
          type: "environment",
          name: "WEB3_BACKUP",
          service: "beacon-chain"
        },
        title: "Add a backup web3 provider",
        description:
          "It's a good idea to add a backup web3 provider in case your main one goes down. For example, if your primary EL client is a local Geth, but you want to use Infura as a backup. Get your web3 backup from [infura](https://infura.io/) (i.e https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@eth2-beacon.infura.io)",
        required: false
      },
      {
        id: "feeRecipientAddress",
        target: {
          type: "environment",
          name: "FEE_RECIPIENT_ADDRESS",
          service: "validator"
        },
        title: "Fee Recipient Address",
        description:
          "Fee Recipient is a feature that lets you specify a priority fee recipient address on your validator client instance and beacon node. After The Merge, execution clients will begin depositing priority fees into this address whenever your validator client proposes a new block.",
        required: true,
        pattern: "^0x[a-fA-F0-9]{40}$",
        patternErrorMessage: "Must be a valid address (0x1fd16a...)"
      }
    ]
  }
};
