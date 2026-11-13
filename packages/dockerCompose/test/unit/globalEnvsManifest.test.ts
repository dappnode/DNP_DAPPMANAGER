import { expect } from "chai";
import { GLOBAL_ENVS, GlobalEnvsPrefixed, Manifest } from "../../../types/src/index.js";
import { validateManifestSchema } from "../../../schemas/src/index.js";
import { ComposeEditor, ComposeServiceEditor } from "../../src/editor.js";
import { params } from "@dappnode/params";

describe("manifest global-env runtime contract", () => {
  const catalogue: GlobalEnvsPrefixed = Object.fromEntries(
    Object.values(GLOBAL_ENVS).map((name) => [name, `value:${name}`])
  );
  const manifest = (globalEnvs: Manifest["globalEnvs"]): Manifest => ({
    name: "example.public.dappnode.eth",
    version: "0.1.0",
    description: "Example package",
    type: "service",
    license: "MIT",
    globalEnvs
  });
  const service = () =>
    new ComposeServiceEditor(
      new ComposeEditor({
        services: { app: { image: "app.example.public.dappnode.eth:0.1.0", environment: { EXISTING: "kept" } } }
      }),
      "app"
    );

  it("injects every short name from the actual runtime catalogue", () => {
    const app = service();
    const config = manifest([
      {
        services: ["app"],
        envs: Object.values(GLOBAL_ENVS).map((name) => name.slice(params.GLOBAL_ENVS_PREFIX.length))
      }
    ]);
    expect(() => validateManifestSchema(config)).to.not.throw();
    app.setGlobalEnvs(config.globalEnvs, catalogue, false);
    expect(app.getEnvs()).to.deep.equal({ EXISTING: "kept", ...catalogue });
  });

  it("only injects into named services", () => {
    const app = service();
    const config = manifest([{ services: ["other"], envs: ["PUBLIC_IP"] }]);
    validateManifestSchema(config);
    app.setGlobalEnvs(config.globalEnvs, catalogue, false);
    expect(app.getEnvs()).to.deep.equal({ EXISTING: "kept" });
  });

  for (const env of ["_DAPPNODE_GLOBAL_PUBLIC_IP", "PUBLIC_IPP", "ACTIVE"]) {
    it(`rejects unsupported or double-prefixed name ${env}`, () => {
      const app = service();
      const config = manifest([{ services: ["app"], envs: [env] }]);
      validateManifestSchema(config);
      expect(() => app.setGlobalEnvs(config.globalEnvs, catalogue, false))
        .to.throw()
        .with.property("message")
        .that.includes("Use short names without _DAPPNODE_GLOBAL_")
        .and.not.includes("allowed are _DAPPNODE_GLOBAL_");
    });
  }

  for (const isCore of [false, true]) {
    it(`accepts the legacy all=true schema and selects the ${isCore ? "core" : "package"} env file`, () => {
      const app = service();
      const config = manifest({ all: true });
      validateManifestSchema(config);
      app.setGlobalEnvs(config.globalEnvs, catalogue, isCore);
      expect(app.get().env_file).to.deep.equal([
        isCore ? params.GLOBAL_ENVS_PATH_FOR_CORE : params.GLOBAL_ENVS_PATH_FOR_DNP
      ]);
    });
  }

  for (const globalEnvs of [{ all: false }, [], [{ services: ["app"], envs: [] }]]) {
    it(`leaves services unchanged for ${JSON.stringify(globalEnvs)}`, () => {
      const app = service();
      const config = manifest(globalEnvs);
      validateManifestSchema(config);
      app.setGlobalEnvs(config.globalEnvs, catalogue, false);
      expect(app.getEnvs()).to.deep.equal({ EXISTING: "kept" });
      expect(app.get()).not.to.have.property("env_file");
    });
  }
});
