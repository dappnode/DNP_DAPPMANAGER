import "mocha";
import { expect } from "chai";
import { runOnlyOneReturnToAll, pause } from "../../src/utils/asyncFlows";

describe("Util: asyncFlows", () => {
  const internalFunctionPause = 8;
  const callDelay = internalFunctionPause / 2 + 1;
  const finalPauseToEnsureCompletition = internalFunctionPause * 1.5;

  describe("runOnlyOneReturnToAll", () => {
    it("Should run requests in the correct order", async () => {
      const mockLog: string[] = [];
      function log(s: string): void {
        mockLog.push(s);
      }
      const throttledCallback = runOnlyOneReturnToAll(async () => {
        await pause(internalFunctionPause);
        return "success async";
      });
      for (let i = 0; i < 4; i++) {
        log(`Requesting ${i}`);
        throttledCallback().then(res => log(`${res} ${i}`));
        await pause(callDelay);
      }
      await pause(finalPauseToEnsureCompletition);
      expect(mockLog).to.deep.equal([
        "Requesting 0",
        "Requesting 1",
        "success async 0",
        "success async 1",
        "Requesting 2",
        "Requesting 3",
        "success async 2",
        "success async 3"
      ]);
    });

    it("Should handle errors", async () => {
      const mockLog: string[] = [];
      function log(s: string): void {
        mockLog.push(s);
      }
      const throttledCallback = runOnlyOneReturnToAll(async () => {
        await pause(internalFunctionPause);
        throw Error("mock error async");
      });
      for (let i = 0; i < 4; i++) {
        log(`Requesting ${i}`);
        throttledCallback().then(
          res => log(`${res} ${i}`),
          err => log(`${err.message} ${i}`)
        );
        await pause(callDelay);
      }
      await pause(finalPauseToEnsureCompletition);
      expect(mockLog).to.deep.equal([
        "Requesting 0",
        "Requesting 1",
        "mock error async 0",
        "mock error async 1",
        "Requesting 2",
        "Requesting 3",
        "mock error async 2",
        "mock error async 3"
      ]);
    });
  });
});
