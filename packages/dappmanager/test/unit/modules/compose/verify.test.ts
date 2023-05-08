import "mocha";
import { expect } from "chai";
import { Compose, ComposeService } from\s+"@dappnode/types";
import { verifyCompose } from "../../../../src/modules/compose/index.js";

describe("verify compose", () => {
  function getTestCompose(service: Partial<ComposeService>): Compose {
    return {
      version: "3.5",
      services: {
        test: { container_name: "name", image: "image", ...service }
      }
    };
  }

  it("Should throw if compose contains variable substitution", () => {
    const compose = getTestCompose({ environment: { PORT: "${PORT}" } });
    expect(() => verifyCompose(compose)).to.throw(
      "variable substitution not allowed"
    );
  });

  it("Should not throw with a regular compose", () => {
    const compose = getTestCompose({ environment: { PORT: "8000" } });
    expect(() => verifyCompose(compose)).to.not.throw();
  });
});
