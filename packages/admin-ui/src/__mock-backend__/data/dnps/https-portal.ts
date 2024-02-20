import { MockDnp } from "./types";

const dnpName = "https.dnp.dappnode.eth";

export const httpsPortal: MockDnp = {
  avatar: "",

  manifest: {
    name: dnpName,
    version: "0.1.0",
    description: "HTTPs Portal",
    type: "service",
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    links: {
      WebApplication: "http://https.dappnode/",
      homepage: "https://github.com/dappnode/DNP_HTTPS#readme"
    },
    repository: {
      type: "git",
      url: "http://github.com/dappnode/DNP_HTTPS.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DNP_HTTPS/issues"
    },
    license: "GPL-3.0"
  }
};
