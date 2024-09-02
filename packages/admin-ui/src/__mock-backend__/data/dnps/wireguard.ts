import { MockDnp } from "./types";

const dnpName = "wireguard.dnp.dappnode.eth";

export const wireguard: MockDnp = {
  avatar: "",

  manifest: {
    name: dnpName,
    version: "0.1.0",
    description: "Wireguard",
    type: "service",
    author: "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    links: {
      WebApplication: "http://wireguard.dappnode/",
      homepage: "https://github.com/dappnode/DAppNodePackage-wireguard#readme"
    },
    repository: {
      type: "git",
      url: "http://github.com/dappnode/DAppNodePackage-wireguard.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-wireguard/issues"
    },
    license: "GPL-3.0"
  }
};
