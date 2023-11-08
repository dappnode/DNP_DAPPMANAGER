import { DappgetTestCase } from "../testHelpers.js";

const caseData: DappgetTestCase = {
  name: "already updated",
  req: {
    name: "core.dnp.dappnode.eth",
    ver: "^0.1.0"
  },
  expectedState: {},
  alreadyUpdated: {
    "core.dnp.dappnode.eth": "0.1.0",
    "dappmanager.dnp.dappnode.eth": "0.1.0"
  },
  dnps: {
    "core.dnp.dappnode.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.0": { "dappmanager.dnp.dappnode.eth": "0.1.0" }
      }
    },
    "dappmanager.dnp.dappnode.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.0": {}
      }
    }
  }
};

export default caseData;
