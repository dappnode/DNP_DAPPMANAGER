import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { PackageContainer } from "../../../src/types";
import { mockDnp } from "../../testUtils";
import rewiremock from "rewiremock";
import { DappGetFetcherMock, DappgetTestCase } from "./testHelpers";
import { mapValues } from "lodash";
import { logs } from "../../../src/logs";

// Imports for types
import dappGetType from "../../../src/modules/dappGet";
import aggregateType from "../../../src/modules/dappGet/aggregate";

/* eslint-disable no-console */

const log = false;
function logBig(...args: string[]): void {
  const b = "=".repeat(20);
  if (log)
    logs.info(
      `\n${b}\n${args.map((s: string) => String(s)).join(`\n${b}\n`)}\n${b}'\n`
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
    .forEach(casePath => {
      const caseData: DappgetTestCase = require(path.resolve(
        casesFolder,
        casePath
      )).default;
      describe(`Case: ${caseData.name}`, () => {
        // Prepare dependencies

        const dnpList: PackageContainer[] = Object.keys(caseData.dnps)
          .filter(dnpName => caseData.dnps[dnpName].installed)
          .map(dnpName => {
            const installedVersion = caseData.dnps[dnpName].installed || "";
            const dnp = caseData.dnps[dnpName].versions[installedVersion];
            if (!dnp)
              throw Error(
                `The installed version must be defined: ${dnpName} @ ${installedVersion}`
              );

            return {
              ...mockDnp,
              name: dnpName,
              version: installedVersion,
              origin: undefined,
              dependencies: dnp || {}
            };
          });

        // Autogenerate a listContainers reponse from the caseData object
        async function listContainers(): Promise<PackageContainer[]> {
          return dnpList;
        }

        const dappGetFetcher = new DappGetFetcherMock(
          mapValues(caseData.dnps, dnp => dnp.versions)
        );

        let dappGet: typeof dappGetType;
        let aggregate: typeof aggregateType;

        before("Mock", async () => {
          const dappGetImport = await rewiremock.around(
            () => import("../../../src/modules/dappGet"),
            mock => {
              mock(() => import("../../../src/modules/docker/listContainers"))
                .with({ listContainers })
                .toBeUsed();
            }
          );
          const aggregateImport = await rewiremock.around(() =>
            import("../../../src/modules/dappGet/aggregate")
          );
          dappGet = dappGetImport.default;
          aggregate = aggregateImport.default;
        });

        it("Agreggate dnps for the integration test", async () => {
          const dnps = await aggregate({
            req: caseData.req,
            dnpList,
            dappGetFetcher
          });
          logBig("  Aggregated DNPs", JSON.stringify(dnps, null, 2));
          expect(Boolean(Object.keys(dnps).length)).to.equal(
            true,
            "Make sure the aggregation is not empty"
          );
          expect(Boolean(dnps[caseData.req.name])).to.equal(
            true,
            "Make sure the aggregation includes the requested package"
          );
          if (caseData.expectedAggregate) {
            expect(dnps).to.deep.equal(caseData.expectedAggregate);
          }
        });

        it("Should return the expect result", async () => {
          const result = await dappGet(caseData.req, {}, dappGetFetcher);
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
          expect(Boolean(state[caseData.req.name])).to.equal(
            true,
            "Make sure the success object includes the requested package"
          );
          expect(state).to.deep.equal(caseData.expectedState);

          if (caseData.alreadyUpdated) {
            expect(alreadyUpdated).to.deep.equal(caseData.alreadyUpdated);
          }
        });
      });
    });
});
