/**
 * Case: Don't install a package if not necessary
 *
 * If A depends on B on specific versions, B will be added as possible package
 * However, it has to be given the option to not be installed, as it happens
 * in the solution of this case.
 *
 * TO SOLVE THIS: In prioritizeVersions.js null versions are added
 * as the first possible version of each newly install package
 */

module.exports = {
  name: "dont install DNP if not necessary",
  req: {
    name: "dnp-a.eth",
    ver: "^0.1.0"
  },
  expectedState: {
    "dnp-a.eth": "0.1.2"
  },
  expectedAggregate: {
    "dnp-a.eth": {
      isRequest: true,
      versions: {
        "0.1.0": {},
        "0.1.1": { "dnp-c.eth": "0.1.0" },
        "0.1.2": {}
      }
    },
    "dnp-c.eth": {
      versions: {
        "0.1.0": {}
      }
    }
  },
  dnps: {
    "dnp-a.eth": {
      versions: {
        "0.1.0": { dependencies: {} },
        "0.1.1": { dependencies: { "dnp-c.eth": "0.1.0" } },
        "0.1.2": { dependencies: {} }
      }
    },
    "dnp-c.eth": {
      versions: {
        "0.1.0": { dependencies: {} }
      }
    }
  }
};
