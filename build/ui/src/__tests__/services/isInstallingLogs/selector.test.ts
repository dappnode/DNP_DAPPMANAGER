import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";
import { ProgressLogsByDnp } from "types";
import { RootState } from "rootReducer";

const mountPoint = "isInstallingLogs";

describe("service/isInstallingLogs", () => {
  describe("getProgressLogsByDnp", () => {
    const dnpName1 = "ln.dnp.dappnode.eth";
    const dnpName2 = "bitcoin.dnp.dappnode.eth";
    const dnpName3 = "not-installing.dnp.dappnode.eth";
    const id = dnpName1;

    const progressLogs = {
      [dnpName1]: "Downloading 1%...",
      [dnpName2]: "Downloading 2%..."
    };

    const isInstallingLogsState = {
      logs: {
        [id]: progressLogs
      },
      dnpNameToLogId: {
        [dnpName1]: id,
        [dnpName2]: id,
        [dnpName3]: dnpName3
      }
    };

    const progressLogsByDnpExpected: ProgressLogsByDnp = {
      [dnpName1]: progressLogs,
      [dnpName2]: progressLogs
    };

    // Cast Partial state to state to keep the test without writing the rest of the state
    const state = { [mountPoint]: isInstallingLogsState } as Partial<RootState>;
    it("Should a nicely formated object ready to query", () => {
      expect(getProgressLogsByDnp(state as RootState)).toEqual(
        progressLogsByDnpExpected
      );
    });

    it("Should check that dnpName1 is installing", () => {
      expect(Boolean(progressLogsByDnpExpected[dnpName1])).toEqual(true);
    });

    it("Should check that dnpName3 is NOT installing", () => {
      expect(Boolean(progressLogsByDnpExpected[dnpName3])).toEqual(false);
    });

    it("Should check that dnpNameOther is NOT installing", () => {
      expect(Boolean(progressLogsByDnpExpected["other"])).toEqual(false);
    });
  });
});
