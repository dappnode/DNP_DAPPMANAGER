import { expect } from "chai";
import { Manifest } from "@dappnode/types";
import { validateManifestSchema } from "../../src/index.js";

describe("manifest contract", () => {
  const manifest = (extra: Record<string, unknown> = {}): Manifest =>
    ({
      name: "example.dnp.dappnode.eth",
      version: "1.2.3",
      description: "Example package",
      type: "service",
      license: "MIT",
      ...extra
    }) as Manifest;

  it("accepts explicit short global-env names and services", () => {
    expect(() =>
      validateManifestSchema(
        manifest({
          globalEnvs: [{ envs: ["PUBLIC_IP", "ENVS_ACTIVE"], services: ["app"] }]
        })
      )
    ).to.not.throw();
  });

  for (const all of [true, false]) {
    it(`accepts the runtime's legacy global-env all=${all} form`, () => {
      expect(() => validateManifestSchema(manifest({ globalEnvs: { all } }))).to.not.throw();
    });
  }

  for (const globalEnvs of [
    [{}],
    [{ envs: ["PUBLIC_IP"] }],
    [{ services: ["app"] }],
    [{ envs: ["PUBLIC_IP"], services: { app: true } }],
    [{ envs: ["PUBLIC_IP"], services: [{}] }],
    [{ envs: [""], services: ["app"] }],
    {},
    { all: "invalid" }
  ]) {
    it(`rejects malformed global-env configuration ${JSON.stringify(globalEnvs)}`, () => {
      expect(() => validateManifestSchema(manifest({ globalEnvs }))).to.throw("Invalid manifest");
    });
  }

  // Name/service existence is semantic validation against the resolved compose,
  // not an enum embedded in the schema that could lag a runtime catalogue update.
  it("leaves global-env catalogue checks to semantic validation", () => {
    expect(() =>
      validateManifestSchema(
        manifest({
          globalEnvs: [{ envs: ["FUTURE_RUNTIME_ENV"], services: ["app"] }]
        })
      )
    ).to.not.throw();
  });

  for (const version of ["1x2x3", "1.2.3-rc.1", "v1.2.3", "1.2", "1.2.3.4"]) {
    it(`rejects malformed package version ${version}`, () => {
      expect(() => validateManifestSchema(manifest({ version }))).to.throw("Invalid manifest");
    });
  }

  for (const field of ["minimumDappnodeVersion", "minimumDockerVersion"]) {
    it(`uses literal dots for requirements.${field}`, () => {
      expect(() => validateManifestSchema(manifest({ requirements: { [field]: "1x2x3" } }))).to.throw(
        "Invalid manifest"
      );
      expect(() => validateManifestSchema(manifest({ requirements: { [field]: "1.2.3" } }))).to.not.throw();
    });
  }
});
