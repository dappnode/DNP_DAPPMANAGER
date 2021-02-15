import { MockDnp } from "./types";

const dnpName = "https-portal.dnp.dappnode.eth";

export const httpsPortal: MockDnp = {
  avatar: "",

  metadata: {
    name: dnpName,
    version: "0.1.0",
    description: "HTTPs Portal",
    type: "service",
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    links: {
      WebApplication: "http://https-portal.dappnode/",
      homepage:
        "https://github.com/dappnode/DAppNodePackage-https-portal#readme"
    },
    repository: {
      type: "git",
      url: "http://github.com/dappnode/DAppNodePackage-https-portal.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-https-portal/issues"
    },
    license: "GPL-3.0"
  }
};
