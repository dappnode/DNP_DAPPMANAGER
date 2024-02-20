import { MockDnp } from "./types";

export const geth: MockDnp = {
  avatar:
    "https://github.com/dappnode/DAppNodePackage-geth/blob/master/geth-avatar.png",

  manifest: {
    name: "geth.dnp.dappnode.eth",
    version: "0.1.17",
    upstreamVersion: "v1.10.21",
    upstreamRepo: "ethereum/go-ethereum",
    upstreamArg: "UPSTREAM_VERSION",
    shortDescription:
      "Geth is the official Go implementation of the Ethereum protocol.",
    description:
      "Ethereum is a global, open-source platform for decentralized applications where you can write code that controls digital value, runs exactly as programmed, and is accessible anywhere in the world.",
    type: "service",
    architectures: ["linux/amd64", "linux/arm64"],
    chain: "ethereum",
    dockerTimeout: "20min",
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [
      "Mariano Conti (nanexcool) (hhttps://github.com/nanexcool)",
      "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
      "MysticRyuujin <MysticRyuujin@gmail.com> (https://github.com/MysticRyuujin)"
    ],
    categories: ["Blockchain"],
    keywords: ["geth", "go-ethereum", "ethereum", "client", "execution"],
    license: "GPL-3.0",
    links: {
      endpoint: "http://geth.dappnode:8545",
      homepage: "https://github.com/dappnode/DAppNodePackage-geth#readme"
    },
    repository: {
      type: "git",
      url: "https://github.com/dappnode/DAppNodePackage-geth.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-geth/issues"
    }
  }
};
