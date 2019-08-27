import "mocha";
import { expect } from "chai";
const proxyquire = require("proxyquire").noCallThru();
import * as safeSemver from "../../../src/modules/dappGet/utils/safeSemver";
import fs from "fs";
import path from "path";
import { FetchFunction } from "../../../src/modules/dappGet/types";

/* eslint-disable no-console */

const log = false;
function logBig(...args: any) {
  const b = "=".repeat(20);
  if (log)
    console.log(
      `\n${b}\n${args.map((s: any) => String(s)).join(`\n${b}\n`)}\n${b}'\n`
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

        // Autogenerate a listContainers reponse from the _case object
        const listContainers = async () =>
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
            });

        const fetch: FetchFunction = {
          dependencies: async ({
            name,
            ver
          }: {
            name: string;
            ver: string;
          }) => {
            if (!_case.dnps[name])
              throw Error(`dnp ${name} is not in the case definition`);
            if (!_case.dnps[name].versions[ver])
              throw Error(
                `Version ${name} @ ${ver} is not in the case definition`
              );
            return _case.dnps[name].versions[ver].dependencies;
          },
          versions: async ({
            name,
            versionRange
          }: {
            name: string;
            versionRange: string;
          }) => {
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

        const { default: dappGet } = proxyquire(
          "../../../src/modules/dappGet",
          {
            "./fetch": fetch,
            "../../modules/listContainers": listContainers
          }
        );

        const { default: aggregate } = proxyquire(
          "../../../src/modules/dappGet/aggregate",
          {
            "../../../modules/listContainers": listContainers
          }
        );

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
