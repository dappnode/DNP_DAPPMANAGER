import "mocha";
import { expect } from "chai";
import {
  runOnlyOneSequentially,
  runOnlyOneReturnToAll,
  pause,
} from "../../src/asyncFlows.js";

describe("Util: asyncFlows", () => {
  describe("runOnlyOneSequentially", () => {
    it("Should run multiple requests once, and then one more time", async () => {
      const requestNum = 4;
      const internalFunctionPause = 20;
      const callDelay = Math.floor(internalFunctionPause / (requestNum + 1));
      const finalPauseToEnsureCompletition = internalFunctionPause * 1.5;

      const mockLog: string[] = [];
      function log(s: string): void {
        mockLog.push(s);
      }
      const throttledCallback = runOnlyOneSequentially(async (i?: number) => {
        await pause(internalFunctionPause);
        log(`success async ${i}`);
      });
      for (let i = 0; i < 4; i++) {
        log(`Requesting ${i}`);
        throttledCallback(i);
        await pause(callDelay);
      }

      await pause(finalPauseToEnsureCompletition);
      expect(mockLog).to.deep.equal([
        "Requesting 0",
        "Requesting 1",
        "Requesting 2",
        "Requesting 3",
        "success async 0",
        "success async 1",
      ]);
    });

    it("Should handle errors", async () => {
      const callDelay = 5;

      const mockLog: string[] = [];
      function log(s: string): void {
        mockLog.push(s);
      }
      const throttledCallback = runOnlyOneSequentially(async () => {
        throw Error("<<< MOCK ERROR >>>");
      });
      for (let i = 0; i < 4; i++) {
        log(`Requesting ${i}`);
        throttledCallback();
        await pause(callDelay);
      }

      expect(mockLog).to.deep.equal([
        "Requesting 0",
        "Requesting 1",
        "Requesting 2",
        "Requesting 3",
      ]);
    });
  });

  describe.skip("runOnlyOneReturnToAll", () => {
    /**
   * Behaviour
Requesting 0
processing...
Requesting 1
Requesting 2
Requesting 3
Requesting 4
Error 0: 0.7024611480528518
Error 1: 0.7024611480528518
Error 2: 0.7024611480528518
Error 3: 0.7024611480528518
Error 4: 0.7024611480528518
Requesting 5
processing...
Requesting 6
Requesting 7
Requesting 8
Requesting 9
Result 5: 0.20420982604573523
Result 6: 0.20420982604573523
Result 7: 0.20420982604573523
Result 8: 0.20420982604573523
Result 9: 0.20420982604573523
Requesting 10
Result 10: 0.20420982604573523
Requesting 11
processing...
Requesting 12
Requesting 13
Requesting 14
Requesting 15
Error 11: 0.616938341865086
Error 12: 0.616938341865086
Error 13: 0.616938341865086
Error 14: 0.616938341865086
Error 15: 0.616938341865086
   */
    it.skip("Long test", async () => {
      const internalFunctionPause = 500;
      const callDelay = 100;
      let isProcessing = false;

      const mockLog: string[] = [];
      function log(s: string): void {
        console.log(s);
        mockLog.push(s);
      }
      const throttledCallback = runOnlyOneReturnToAll(
        async (c: { a: number }) => {
          c;
          if (isProcessing)
            throw Error(`Cannot process twice at the same time`);
          isProcessing = true;
          log(`processing...`);
          await pause(internalFunctionPause);
          isProcessing = false;
          const res = Math.random();
          if (res > 0.5) throw Error(String(res));
          else return res;
        }
      );

      for (let i = 0; i < 100; i++) {
        log(`Requesting ${i}`);
        throttledCallback({ a: 9 })
          .then((res) => log(`Result ${i}: ${res}`))
          .catch((e) => log(`Error ${i}: ${e.message}`));
        await pause(callDelay);
      }
    });

    it("Should run multiple requests once, and then NOT run", async () => {
      const requestNum = 4;
      const internalFunctionPause = 20;
      const callDelay = Math.floor(internalFunctionPause / (requestNum + 1));
      const finalPauseToEnsureCompletition = internalFunctionPause * 1.5;

      const mockLog: string[] = [];
      function log(s: string): void {
        mockLog.push(s);
      }
      let i = 0;
      const throttledCallback = runOnlyOneReturnToAll(async () => {
        await pause(internalFunctionPause);
        log(`success async ${i++}`);
      });
      for (let i = 0; i < 4; i++) {
        log(`Requesting ${i}`);
        throttledCallback();
        await pause(callDelay);
      }

      await pause(finalPauseToEnsureCompletition);
      expect(mockLog).to.deep.equal([
        "Requesting 0",
        "Requesting 1",
        "Requesting 2",
        "Requesting 3",
        "success async 0",
      ]);
    });

    it("Should run requests in the correct order", async () => {
      const internalFunctionPause = 8;
      const callDelay = internalFunctionPause / 2 + 1;
      const finalPauseToEnsureCompletition = internalFunctionPause * 1.5;

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
        throttledCallback().then((res) => log(`${res} ${i}`));
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
        "success async 3",
      ]);
    });

    it("Should handle errors", async () => {
      const internalFunctionPause = 8;
      const callDelay = internalFunctionPause / 2 + 1;
      const finalPauseToEnsureCompletition = internalFunctionPause * 1.5;

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
          (res) => log(`${res} ${i}`),
          (err) => log(`${err.message} ${i}`)
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
        "mock error async 3",
      ]);
    });
  });
});
