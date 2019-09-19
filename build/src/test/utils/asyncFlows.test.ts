import "mocha";
import { expect } from "chai";
import {
  runOnlyOneSequentially,
  runOnlyOneReturnToAll,
  runWithRetry,
  pause
} from "../../src/utils/asyncFlows";

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
        "success async 1"
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
        "Requesting 3"
      ]);
    });
  });

  describe("runOnlyOneReturnToAll", () => {
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
        "success async 0"
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

  describe("runWithRetry", () => {
    const errorMessage = "Mock error";
    const arg = "Mock argument";
    const times = 3;
    const base = 1;

    it("Should fail 2 times and then return success", async () => {
      let count = 0;
      const retryable = runWithRetry(
        async function(name: string): Promise<string> {
          if (count++ < times - 1) throw Error(errorMessage);
          else return name;
        },
        { times, base }
      );

      const res = await retryable(arg);
      expect(res).to.equal(arg);
      expect(count).to.equal(times);
    });

    it("Should fail 3 times and then throw", async () => {
      let count = 0;
      const retryable = runWithRetry(
        async function(name: string): Promise<string> {
          if (count++ < times + 1) throw Error(errorMessage);
          else return name;
        },
        { times, base }
      );

      const res = await retryable(arg).catch(e => e.message);
      expect(res).to.equal(errorMessage);
      expect(count).to.equal(times);
    });

    it("Should succeed on first try", async () => {
      let count = 0;
      const retryable = runWithRetry(
        async function(name: string): Promise<string> {
          count++;
          return name;
        },
        { times, base }
      );

      const res = await retryable(arg);
      expect(res).to.equal(arg);
      expect(count).to.equal(1);
    });
  });
});
