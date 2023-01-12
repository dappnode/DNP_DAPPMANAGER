import * as logUserAction from "../../../src/logUserAction";
import { UserActionLog } from "@dappnode/common";
import "mocha";
import { expect } from "chai";

describe("Util: logUserAction", () => {
  it("Should return true due to a big log", () => {
    const bigBuffer = Buffer.alloc(3073, "a");
    const bigString: UserActionLog = bigBuffer.toString(
      "utf8"
    ) as unknown as UserActionLog;

    expect(logUserAction.isLogTooBig(bigString)).to.be.true;
  });

  it("Should return false due to a small log", () => {
    const bigBuffer = Buffer.alloc(3069, "a");
    const bigString: UserActionLog = bigBuffer.toString(
      "utf8"
    ) as unknown as UserActionLog;

    expect(logUserAction.isLogTooBig(bigString)).to.be.false;
  });
});
