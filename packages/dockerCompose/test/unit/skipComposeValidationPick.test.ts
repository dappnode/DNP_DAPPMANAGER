import "mocha";
import { expect } from "chai";
import { spawnSync } from "child_process";

describe("setDappnodeComposeDefaults respects SKIP_COMPOSE_VALIDATION", () => {
  function runCheck({
    skipComposeValidation,
    expectEnvFile
  }: {
    skipComposeValidation: string;
    expectEnvFile: boolean;
  }) {
    const helperUrl = new URL("./helpers/checkSkipComposeValidationPick.ts", import.meta.url);
    const helperPath = helperUrl.pathname;

    const res = spawnSync(
      process.execPath,
      ["--experimental-specifier-resolution=node", "--import=tsx/esm", helperPath, String(expectEnvFile)],
      {
        env: {
          ...process.env,
          SKIP_COMPOSE_VALIDATION: skipComposeValidation
        },
        encoding: "utf8"
      }
    );

    if (res.status !== 0) {
      throw new Error(`child process failed\nstdout:\n${res.stdout || ""}\nstderr:\n${res.stderr || ""}`);
    }
  }

  it("picks non-whitelisted keys when SKIP_COMPOSE_VALIDATION=true", () => {
    expect(() => runCheck({ skipComposeValidation: "true", expectEnvFile: true })).to.not.throw();
  });

  it("does not pick non-whitelisted keys when SKIP_COMPOSE_VALIDATION=false", () => {
    expect(() => runCheck({ skipComposeValidation: "false", expectEnvFile: false })).to.not.throw();
  });
});
