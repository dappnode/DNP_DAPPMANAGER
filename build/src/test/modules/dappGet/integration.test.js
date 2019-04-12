const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const safeSemver = require("modules/dappGet/utils/safeSemver");
const fs = require("fs");
const path = require("path");

/* eslint-disable no-console */

const log = false;
function logBig(...args) {
  const b = "=".repeat(20);
  if (log)
    console.log(
      `\n${b}\n${args.map(s => String(s)).join(`\n${b}\n`)}\n${b}'\n`
    );
}

/**
 * Purpose of the test. Make sure packages are moved to the alreadyUpgraded object
 */

describe("dappGet integration test", () => {
  /**
   * Loads all files in the ./cases folder
   * Each file describes a case with a req, dnps info and an expected result
   */
  const casesFolder = path.resolve(__dirname, "cases");
  fs.readdirSync(casesFolder)
    // Ignore README.md
    .filter(fileName => fileName.endsWith(".js"))
    .forEach(casePath => {
      const _case = require(path.resolve(casesFolder, casePath));
      describe(`Case: ${_case.name}`, () => {
        // Prepare dependencies

        // Autogenerate a dockerList reponse from the _case object
        const dockerList = {
          listContainers: async () =>
            Object.keys(_case.dnps)
              .filter(dnpName => _case.dnps[dnpName].installed)
              .map(dnpName => {
                const dnp =
                  _case.dnps[dnpName].versions[_case.dnps[dnpName].installed];
                if (!dnp) {
                  throw Error(
                    `The installed version must be defined: ${dnpName} @ ${
                      _case.dnps[dnpName].installed
                    }`
                  );
                }
                return {
                  name: dnpName,
                  version: _case.dnps[dnpName].installed,
                  origin: dnp.origin,
                  dependencies: dnp.dependencies || {}
                };
              })
        };

        const fetch = {
          dependencies: async ({ name, version }) => {
            if (!_case.dnps[name])
              throw Error(`dnp ${name} is not in the case definition`);
            if (!_case.dnps[name].versions[version])
              throw Error(
                `Version ${name} @ ${version} is not in the case definition`
              );
            return _case.dnps[name].versions[version].dependencies;
          },
          versions: async ({ name, versionRange }) => {
            if (!_case.dnps[name])
              throw Error(`dnp ${name} is not in the case definition`);
            const allVersions = Object.keys(_case.dnps[name].versions);
            const validVersions = allVersions.filter(version =>
              safeSemver.satisfies(version, versionRange)
            );
            if (!validVersions.length)
              throw Error(
                `No version satisfied ${name} @ ${versionRange}, versions: ${allVersions.join(
                  ", "
                )}`
              );
            return validVersions;
          }
        };

        const dappGet = proxyquire("modules/dappGet", {
          "./fetch": fetch,
          "modules/dockerList": dockerList
        });

        const aggregate = proxyquire("modules/dappGet/aggregate", {
          "modules/dockerList": dockerList
        });

        it("Agreggate dnps for the integration test", async () => {
          const dnps = await aggregate({ req: _case.req, fetch });
          logBig("  Aggregated DNPs", JSON.stringify(dnps, null, 2));
          expect(Boolean(Object.keys(dnps).length)).to.equal(
            true,
            "Make sure the aggregation is not empty"
          );
          expect(Boolean(dnps[_case.req.name])).to.equal(
            true,
            "Make sure the aggregation includes the requested package"
          );
          if (_case.expectedAggregate) {
            expect(dnps).to.deep.equal(_case.expectedAggregate);
          }
        });

        it("Should return the expect result", async () => {
          const result = await dappGet(_case.req);
          const { state, alreadyUpdated } = result;
          logBig("  DNPs result", JSON.stringify(result, null, 2));

          expect(Boolean(Object.keys(state).length)).to.equal(
            true,
            `Make sure the success object is not empty: ${JSON.stringify(
              result,
              null,
              2
            )}`
          );
          expect(Boolean(state[_case.req.name])).to.equal(
            true,
            "Make sure the success object includes the requested package"
          );
          expect(state).to.deep.equal(_case.expectedState);

          if (_case.alreadyUpdated) {
            expect(alreadyUpdated).to.deep.equal(_case.alreadyUpdated);
          }
        });
      });
    });
});
