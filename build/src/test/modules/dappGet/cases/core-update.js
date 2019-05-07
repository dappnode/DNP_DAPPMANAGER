module.exports = {
  name: "core update",
  req: {
    name: "ethforward.dnp.dappnode.eth",
    ver: "0.1.2"
  },
  expectedState: {
    "ethforward.dnp.dappnode.eth": "0.1.2"
  },
  expectedAggregate: {
    "ethforward.dnp.dappnode.eth": {
      isRequest: true,
      versions: {
        "0.1.2": {}
      }
    }
  },
  dnps: {
    "ethforward.dnp.dappnode.eth": {
      installed: "0.1.1",
      versions: {
        "0.1.2": { dependencies: {} },
        "0.1.1": { dependencies: {} },
        "0.1.0": { dependencies: {} }
      }
    },
    "vnp.dnp.dappnode.eth": {
      installed: "0.1.1",
      versions: {
        "0.1.1": { dependencies: {} },
        "0.1.0": { dependencies: {} }
      }
    },
    "dappmanager.dnp.dappnode.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.1": { dependencies: {} },
        "0.1.0": { dependencies: {} }
      }
    },
    "core.dnp.dappnode.eth": {
      installed: "0.1.1",
      versions: {
        "0.1.1": {
          dependencies: {
            "vnp.dnp.dappnode.eth": "0.1.1",
            "dappmanager.dnp.dappnode.eth": "0.1.0",
            "ethforward.dnp.dappnode.eth": "0.1.1"
          }
        },
        "0.1.0": {
          dependencies: {
            "vnp.dnp.dappnode.eth": "0.1.0",
            "dappmanager.dnp.dappnode.eth": "0.1.0",
            "ethforward.dnp.dappnode.eth": "0.1.0"
          }
        }
      }
    }
  }
};
