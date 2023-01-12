import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { InstalledPackageData } from "@dappnode/common";
import { mockDnp } from "../../../testUtils";
import rewiremock from "rewiremock/webpack";
import { DappGetFetcherMock, DappgetTestCase } from "./testHelpers";
import { mapValues, isEmpty } from "lodash-es";
import { logs } from "../../../../src/logs";
import { fileURLToPath } from "url";

// Imports for types
import dappGetType from "../../../../src/modules/dappGet";
import aggregateType from "../../../../src/modules/dappGet/aggregate";

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

describe.skip("dappGet integration test", async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  /**
   * Loads all files in the ./cases folder
   * Each file describes a case with a req, dnps info and an expected result
   */
  const casesFolder = path.join(__dirname, "cases");
  for (const casePath of fs.readdirSync(casesFolder)) {
    // Load the case data with ES6 import
    const caseData: DappgetTestCase = await import(
      path.join(casesFolder, casePath)
    ).then(m => m.default);

    describe.skip(`Case: ${caseData.name}`, () => {
      // Prepare dependencies

      const dnpList: InstalledPackageData[] = Object.keys(caseData.dnps)
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
            dnpName: dnpName,
            version: installedVersion,
            origin: undefined,
            dependencies: dnp || {}
          };
        });

      // Autogenerate a listContainers reponse from the caseData object
      async function listPackages(): Promise<InstalledPackageData[]> {
        return dnpList;
      }

      const dappGetFetcher = new DappGetFetcherMock(
        mapValues(caseData.dnps, dnp => dnp.versions)
      );

      let dappGet: typeof dappGetType;
      let aggregate: typeof aggregateType;

      before("Mock", async () => {
        const dappGetImport = await rewiremock.around(
          () => import("../../../../src/modules/dappGet"),
          mock => {
            mock(() => import("../../../../src/modules/docker/list"))
              .with({ listPackages })
              .toBeUsed();
          }
        );
        const aggregateImport = await rewiremock.around(
          () => import("../../../../src/modules/dappGet/aggregate")
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
        expectNotEmpty(dnps);
        expect(
          dnps,
          "Make sure the aggregation object includes the requested package"
        ).to.have.property(caseData.req.name);
        if (caseData.expectedAggregate) {
          expect(dnps).to.deep.equal(caseData.expectedAggregate);
        }
      });

      it("Should return the expect result", async () => {
        const result = await dappGet(caseData.req, {}, dappGetFetcher);
        const { state, alreadyUpdated } = result;
        logBig("  DNPs result", JSON.stringify(result, null, 2));

        expect(state).to.deep.equal(caseData.expectedState);

        if (caseData.alreadyUpdated) {
          expect(alreadyUpdated).to.deep.equal(caseData.alreadyUpdated);
        }
      });
    });
  }
});

function expectNotEmpty(obj: unknown): void {
  expect(isEmpty(obj), "Obj must not be empty: " + JSON.stringify(obj, null, 2))
    .to.be.false;
}
