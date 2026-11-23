import { expect } from "chai";
import type { Routes } from "@dappnode/types";
import { getRpcHandler } from "../../../src/api/handler/index.js";

describe("api / handler / getRpcHandler", () => {
  it("reports param validation errors relative to `params`", async () => {
    const rpcHandler = getRpcHandler({ packageInstall: async () => {} } as unknown as Routes);
    const res = await rpcHandler({ method: "packageInstall", params: [{}] });

    expect(res.error?.message).to.include("Validation error:");
    expect(res.error?.message).to.include("params/0 must have required property 'name'");
    expect(res.error?.message).to.not.include("root_prop");
  });
});
