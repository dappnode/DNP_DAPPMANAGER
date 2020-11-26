import { MockDnp } from "./types";

const dnpName = "prysm.dnp.dappnode.eth";
const serviceName = dnpName;

export const prysm: MockDnp = {
  avatar:
    "https://bafybeickefnrsnrrtwq6bl4x3yioshbfb2qo7w4jwcbmj5kktv5sdmy5fu.ipfs.infura-ipfs.io/avatar.png",

  directory: {
    isFeatured: true
  },

  metadata: {
    name: dnpName,
    version: "1.0.0",
    upstreamVersion: "v1.0.0",
    shortDescription: "Prysm mainnet ETH2.0 Beacon chain + validator",
    description:
      "Validate with Prysm: a Go implementation of the Ethereum 2.0 Serenity protocol and open source project created by Prysmatic Labs.",
    type: "service",
    architectures: ["linux/amd64", "linux/arm64"],
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
      minimumDappnodeVersion: "0.2.39"
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
      readme: "https://github.com/dappnode/DAppNodePackage-prysm",
      prysm: "https://prylabs.net"
    }
  }
};
