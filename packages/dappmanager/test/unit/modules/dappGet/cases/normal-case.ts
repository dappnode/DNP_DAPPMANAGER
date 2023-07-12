import { DappgetTestCase } from "../testHelpers.js";

const caseData: DappgetTestCase = {
  name: "normal case",
  req: {
    name: "nginx-proxy.dnp.dappnode.eth",
    ver: "^0.1.1"
  },
  expectedState: {
    "nginx-proxy.dnp.dappnode.eth": "0.1.1"
  },
  dnps: {
    "web.dnp.dappnode.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.0": {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        }
      }
    },
    "nginx-proxy.dnp.dappnode.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.1": { "nginx-proxy.dnp.dappnode.eth": "latest" },
        "0.1.0": { "nginx-proxy.dnp.dappnode.eth": "latest" }
      }
    },
    "letsencrypt-nginx.dnp.dappnode.eth": {
      installed: "0.0.4",
      versions: {
        "0.0.4": { "web.dnp.dappnode.eth": "latest" }
      }
    }
  }
};

export default caseData;
