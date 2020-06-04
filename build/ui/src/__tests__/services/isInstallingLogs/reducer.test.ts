import { reducer } from "services/isInstallingLogs/reducer";
import {
  updateIsInstallingLog,
  clearIsInstallingLog
} from "services/isInstallingLogs/actions";

describe("services > isInstallingLogs > reducer", () => {
  describe("isInstallingLog dedicated reducers", () => {
    const dnpName1 = "ln.dnp.dappnode.eth";
    const dnpName2 = "bitcoin.dnp.dappnode.eth";
    const id = dnpName1;
    const log = "Loading...";
    let state = {
      logs: {},
      dnpNameToLogId: {}
    };
    const stateFull = {
      logs: {
        [id]: {
          [dnpName1]: log,
          [dnpName2]: log
        }
      },
      dnpNameToLogId: {
        [dnpName1]: id,
        [dnpName2]: id
      }
    };

    it("Should add a log - updateIsInstallingLog", () => {
      const firstLog = "starting...";
      const action = updateIsInstallingLog({
        id,
        dnpName: dnpName1,
        log: firstLog
      });
      state = reducer(state, action);
      expect(state).toEqual({
        logs: {
          [id]: {
            [dnpName1]: firstLog
          }
        },
        dnpNameToLogId: {
          [dnpName1]: id
        }
      });
    });

    it("Should update the log - updateIsInstallingLog", () => {
      const action = updateIsInstallingLog({
        id: dnpName1,
        dnpName: dnpName1,
        log
      });
      state = reducer(state, action);
      expect(state).toEqual({
        logs: {
          [id]: {
            [dnpName1]: log
          }
        },
        dnpNameToLogId: {
          [dnpName1]: id
        }
      });
    });

    it("Should add a second log - updateIsInstallingLog", () => {
      const action = updateIsInstallingLog({
        id: dnpName1,
        dnpName: dnpName2,
        log
      });
      state = reducer(state, action);
      expect(state).toEqual(stateFull);
    });

    it("Should clear the logs", () => {
      const action = clearIsInstallingLog({ id });
      state = reducer(stateFull, action);
      expect(state).toEqual({
        logs: {},
        dnpNameToLogId: {}
      });
    });

    it("Should automatically clean older logs if the id for a dnpName has changed", () => {
      const diffLog = "different log...";
      const action = updateIsInstallingLog({
        id: dnpName2,
        dnpName: dnpName2,
        log: diffLog
      });
      state = reducer(stateFull, action);
      expect(state).toEqual({
        logs: {
          [dnpName2]: {
            [dnpName2]: diffLog
          }
        },
        dnpNameToLogId: {
          ...stateFull.dnpNameToLogId,
          [dnpName2]: dnpName2
        }
      });
    });
  });
});
