import { expect } from "chai";
import { ComposeEditor } from "@dappnode/dockercompose";
import { SignerHoodi, SignerMainnet } from "@dappnode/types";
import { persistBrainBuilderIds } from "../../../src/installer/getInstallerPackageData.js";

describe("persist staged Brain builder IDs across signer updates", () => {
  const environments: Record<string, string>[] = [{ NETWORK: "hoodi" }, { NETWORK: "hoodi", BUILDER_IDS: "" }];
  for (const environment of environments) {
    it(`keeps staged IDs when the new release ${"BUILDER_IDS" in environment ? "declares" : "omits"} the variable`, () => {
      const previous = new ComposeEditor(
        {
          services: {
            brain: { image: "brain:test", environment: ["NETWORK=hoodi", "BUILDER_IDS=titan,aestus", "OTHER=old"] }
          }
        },
        { dnpName: SignerHoodi.Web3signer }
      ).getUserSettings();
      const next = new ComposeEditor(
        {
          services: {
            brain: { image: "brain:test", environment: { ...environment, OTHER: "new" }, volumes: ["data:/data"] },
            web3signer: { image: "web3signer:test", environment: { JAVA_OPTS: "keep" } }
          }
        },
        { dnpName: SignerHoodi.Web3signer }
      );
      next.applyUserSettings(previous, { dnpName: SignerHoodi.Web3signer });
      persistBrainBuilderIds(next, SignerHoodi.Web3signer, previous);
      expect(next.services().brain.getEnvs()).to.deep.equal({
        NETWORK: "hoodi",
        BUILDER_IDS: "titan,aestus",
        OTHER: "old"
      });
      expect(next.services().web3signer.getEnvs()).to.deep.equal({ JAVA_OPTS: "keep" });
      expect(next.compose.services.brain.volumes).to.deep.equal(["data:/data"]);
    });
  }

  it("does not seed new installations, other networks, or empty staged lists", () => {
    const next = new ComposeEditor(
      { services: { brain: { image: "brain:test", environment: { NETWORK: "mainnet" } } } },
      { dnpName: SignerMainnet.Web3signer }
    );
    persistBrainBuilderIds(next, SignerMainnet.Web3signer, { environment: { brain: { BUILDER_IDS: "aestus" } } });
    persistBrainBuilderIds(next, SignerHoodi.Web3signer, {});
    persistBrainBuilderIds(next, SignerHoodi.Web3signer, { environment: { brain: { BUILDER_IDS: " , " } } });
    expect(next.services().brain.getEnvs()).to.deep.equal({ NETWORK: "mainnet" });
  });
});
