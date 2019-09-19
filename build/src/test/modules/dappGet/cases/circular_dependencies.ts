/**
 * Case: Deal with circular dependencies.
 *
 * If not dealt properly circular dependencies create an infinite loop when
 * a resolver is fetching the dependencies of said packages
 * 3 types of loops will be tested
 *   C = Circular
 *   C1 = unitary circular dependency,
 *        C1-A => C1-A
 *   C2 = double circular dependency,
 *        C2-A => C2-B => C2-A
 *   C3 = tripple circular dependency
 *        C3-A => C3-B => C3-C => C3-A
 *
 * TO SOLVE THIS: In getPkgsToInstall.js, if a specific package and version
 * has been already fetched, it will not be fetched again
 */

module.exports = {
  name: "circular dependencies",
  req: {
    name: "dnp-a.eth",
    ver: "0.1.0"
  },
  expectedState: {
    "dnp-a.eth": "0.1.0",
    "dnp-b.eth": "0.1.0",
    "dnp-c.eth": "0.1.0"
  },
  dnps: {
    "dnp-a.eth": {
      versions: {
        "0.1.0": {
          dependencies: { "dnp-b.eth": "0.1.0" }
        }
      }
    },
    "dnp-b.eth": {
      versions: {
        "0.1.0": {
          dependencies: { "dnp-c.eth": "0.1.0" }
        }
      }
    },
    "dnp-c.eth": {
      versions: {
        "0.1.0": {
          dependencies: { "dnp-a.eth": "0.1.0" }
        }
      }
    }
  }
};
