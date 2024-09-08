import { MockDnp } from "./types";

export const web3signer: MockDnp = {
  avatar: "https://github.com/dappnode/DAppNodePackage-web3signer/blob/master/node-avatar.png",

  manifest: {
    name: "web3signer.dnp.dappnode.eth",
    version: "0.1.0",
    upstreamVersion: "22.8.0",
    architectures: ["linux/amd64"],
    upstreamRepo: "ConsenSys/web3signer",
    mainService: "web3signer",
    shortDescription: "Remote signer + slashing protection database + User interface to import validator keystores",
    description:
      "Web3Signer is an open-source signing service developed under the Apache 2.0 license and written in Java. Web3Signer is capable of signing on multiple platforms using private keys stored in an external vault, or encrypted on a disk.",
    type: "service",
    author: "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [
      "mgarciate <mgarciate@gmail.com> (https://github.com/mgarciate)",
      "pablomendezroyo <mendez4a@gmail.com> (https://github.com/pablomendezroyo"
    ],
    categories: ["Blockchain", "ETH2.0"],
    repository: {
      type: "git",
      url: "git+https://github.com/dappnode/DAppNodePackage-web3signer.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-web3signer/issues"
    },
    links: {
      ui: "http://ui.web3signer.dappnode?signer_url=http://web3signer.web3signer.dappnode:9000",
      homepage: "https://docs.web3signer.consensys.net/en/latest/",
      readme: "https://github.com/ConsenSys/web3signer/blob/master/README.md"
    },
    license: "Apache-2.0",
    requirements: {
      minimumDappnodeVersion: "0.2.57"
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
        id: "eth2Client",
        target: {
          type: "environment",
          name: "ETH2_CLIENT",
          service: "web3signer"
        },
        title: "Beacon Chain Consensus Layer Client",
        description:
          "**WARNING**: MAKE SURE YOU SELECT A CLIENT YOU ALREADY HAVE INSTALLED OR ARE ABOUT TO INSTALL. Select the Consensus layer client you want the web3signer to listen to requests from. You can change this parameter in the future",
        enum: ["prysm", "teku", "lighthouse", "lodestar", "nimbus"],
        required: true
      }
    ]
  }
};
