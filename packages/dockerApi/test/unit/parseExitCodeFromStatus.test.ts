import { expect } from "chai";
import { parseExitCodeFromStatus } from "../../src/index.js";

describe("docker / parseExitCodeFromStatus", () => {
  const testCases: {
    id: string;
    status: string;
    exitCode: number | null;
  }[] = [
    { id: "Code 137", status: "Exited (137) 19 hours ago", exitCode: 137 },
    { id: "Code 1", status: "Exited (1) 30 seconds ago", exitCode: 1 },
    { id: "Code 0", status: "Exited (0) 19 hours ago", exitCode: 0 },
    { id: "Lowercase", status: "exited (0) 19 hours ago", exitCode: 0 },
    { id: "Up status", status: "Up 3 weeks", exitCode: null },
    { id: "Bad format", status: "AYSFDUTFY", exitCode: null },
    { id: "Empty", status: "", exitCode: null },
    {
      id: "Not a string",
      status: undefined as unknown as string,
      exitCode: null
    }
  ];

  for (const { id, status, exitCode } of testCases) {
    it(id, () => {
      expect(parseExitCodeFromStatus(status)).to.equal(exitCode);
    });
  }
});
