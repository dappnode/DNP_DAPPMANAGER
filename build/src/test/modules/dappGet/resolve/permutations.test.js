const proxyquire = require("proxyquire");
const expect = require("chai").expect;

/**
 * Purpose of the test. Make sure it is able to pick up relevant installed DNPs
 *
 * REQ: 'nginx-proxy.dnp.dappnode.eth'
 * DEPS:
 * - 'web.dnp.dappnode.eth' => 'nginx-proxy.dnp.dappnode.eth'
 * - 'web.dnp.dappnode.eth' => 'letsencrypt-nginx.dnp.dappnode.eth'
 * - 'letsencrypt-nginx.dnp.dappnode.eth' => 'web.dnp.dappnode.eth'
 *
 * Should be able to return 'web.dnp.dappnode.eth' and 'letsencrypt-nginx.dnp.dappnode.eth'
 * Also should not crash due to a dependency loop
 */

const permutations = proxyquire("modules/dappGet/resolve/permutations", {});

describe("dappGet/resolve/permutations", () => {
  let permutationsTable;
  let permutationsNumber;
  it("should generate the permutations table correctly", () => {
    const dnps = {
      "dependency.dnp.dappnode.eth": {
        versions: {
          "0.1.0": {},
          "/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws": {}
        }
      },
      "letsencrypt-nginx.dnp.dappnode.eth": {
        isInstalled: true,
        versions: {
          "0.1.0": { "web.dnp.dappnode.eth": "latest" },
          "0.1.1": { "web.dnp.dappnode.eth": "latest" }
        }
      },
      "nginx-proxy.dnp.dappnode.eth": {
        isRequest: true,
        versions: {
          "0.1.8": { "nginx-proxy.dnp.dappnode.eth": "latest" },
          "0.1.7": { "nginx-proxy.dnp.dappnode.eth": "latest" }
        }
      },
      "web.dnp.dappnode.eth": {
        isInstalled: true,
        versions: {
          "0.1.2": { "letsencrypt-nginx.dnp.dappnode.eth": "latest" }
        }
      }
    };

    permutationsTable = permutations.getPermutationsTable(dnps);
    expect(permutationsTable).to.deep.equal([
      {
        name: "dependency.dnp.dappnode.eth",
        versions: [
          null,
          "/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws",
          "0.1.0"
        ],
        n: 3,
        m: 1
      },
      {
        name: "letsencrypt-nginx.dnp.dappnode.eth",
        versions: ["0.1.0", "0.1.1"],
        n: 2,
        m: 3
      },
      {
        name: "web.dnp.dappnode.eth",
        versions: ["0.1.2"],
        n: 1,
        m: 6
      },
      {
        name: "nginx-proxy.dnp.dappnode.eth",
        versions: ["0.1.8", "0.1.7"],
        n: 2,
        m: 6
      }
    ]);

    permutationsNumber = permutations.getTotalPermutations(permutationsTable);
    expect(permutationsNumber).to.equal(12);
  });

  it("should get the first permutations correctly", async () => {
    const permutation = permutations.getPermutation(permutationsTable, 0);
    expect(permutation).to.deep.equal({
      "dependency.dnp.dappnode.eth": null,
      "letsencrypt-nginx.dnp.dappnode.eth": "0.1.0",
      "web.dnp.dappnode.eth": "0.1.2",
      "nginx-proxy.dnp.dappnode.eth": "0.1.8"
    });
  });

  it("should get all permutations correctly", async () => {
    // The purpose of this example is to show how the permutations table looks like
    const dnps = {
      A: { isRequest: true, versions: { "1.0.0": {}, "2.0.0": {} } },
      B: { isInstalled: true, versions: { "1.0.0": {}, "2.0.0": {} } },
      C: { versions: { "1.0.0": {}, "2.0.0": {} } }
    };
    const permutationsTable = permutations.getPermutationsTable(dnps);
    const permutationsNumber = permutations.getTotalPermutations(
      permutationsTable
    );
    const _permutations = [];
    for (let i = 0; i < permutationsNumber; i++) {
      _permutations.push(permutations.getPermutation(permutationsTable, i));
    }
    expect(_permutations).to.deep.equal([
      { C: null, B: "1.0.0", A: "2.0.0" },
      { C: "2.0.0", B: "1.0.0", A: "2.0.0" },
      { C: "1.0.0", B: "1.0.0", A: "2.0.0" },
      { C: null, B: "2.0.0", A: "2.0.0" },
      { C: "2.0.0", B: "2.0.0", A: "2.0.0" },
      { C: "1.0.0", B: "2.0.0", A: "2.0.0" },
      { C: null, B: "1.0.0", A: "1.0.0" },
      { C: "2.0.0", B: "1.0.0", A: "1.0.0" },
      { C: "1.0.0", B: "1.0.0", A: "1.0.0" },
      { C: null, B: "2.0.0", A: "1.0.0" },
      { C: "2.0.0", B: "2.0.0", A: "1.0.0" },
      { C: "1.0.0", B: "2.0.0", A: "1.0.0" }
    ]);
  });
});
