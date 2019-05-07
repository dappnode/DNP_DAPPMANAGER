module.exports = {
  name: "upgrade state package because of a dependency",
  req: {
    name: "dnp-a.eth",
    ver: "0.2.0"
  },
  expectedState: {
    "dnp-a.eth": "0.2.0",
    "dnp-b.eth": "0.2.0",
    "dnp-c.eth": "0.2.0"
  },
  dnps: {
    "dnp-a.eth": {
      versions: {
        "0.2.0": { dependencies: { "dnp-c.eth": "0.2.0" } }
      }
    },
    "dnp-b.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.0": { dependencies: { "dnp-c.eth": "0.1.0" } },
        "0.2.0": { dependencies: { "dnp-c.eth": "0.2.0" } }
      }
    },
    "dnp-c.eth": {
      installed: "0.1.0",
      versions: {
        "0.1.0": { dependencies: {} },
        "0.2.0": { dependencies: {} }
      }
    }
  }
};
