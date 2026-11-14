import { expect } from "chai";
import { ComposeEditor } from "@dappnode/dockercompose";
import { MevBoostHoodi, Network, SignerHoodi } from "@dappnode/types";
import { mevBoostRelayIds, migrateMevBoostRelays } from "../../src/migrateMevBoostRelays.js";

const legacyUrl = (host: string): string => `https://0x${"ab".repeat(48)}@${host}`;

describe("MEV-Boost relay preset translation", () => {
  it("maps legacy public-key URLs to IDs in selection order, ignoring whitespace and duplicates", () => {
    expect(
      mevBoostRelayIds(
        Network.Hoodi,
        [
          ` ${legacyUrl("hoodi.titanrelay.xyz")} `,
          legacyUrl("hoodi.aestus.live"),
          "https://hoodi.titanrelay.xyz/",
          "https://boost-relay-hoodi.flashbots.net:443/",
          legacyUrl("builder-hoodi.nflaig.dev"),
          legacyUrl("relay-hoodi.ultrasound.money"),
          legacyUrl("builder-hoodi.pk910.de"),
          " "
        ].join(",")
      )
    ).to.deep.equal(["titan", "aestus", "flashbots", "nflaig", "ultrasound", "pk910"]);
  });

  it("ignores an empty selection", () => {
    expect(mevBoostRelayIds(Network.Hoodi, " , , ")).to.deep.equal([]);
  });

  for (const relay of [
    "https://hoodi.blxrbdn.com",
    "not a URL",
    "https://hoodi.aestus.live.attacker.example",
    "https://hoodi.aestus.live@attacker.example",
    "https://hoodi.aestus.live/other",
    "https://hoodi.aestus.live:8443",
    "https://hoodi.aestus.live?other=1",
    "http://hoodi.aestus.live",
    "https://boost-relay.flashbots.net"
  ]) {
    it(`rejects the entire mixed selection containing ${relay}`, () => {
      expect(() => mevBoostRelayIds(Network.Hoodi, `https://hoodi.aestus.live,${relay}`)).to.throw();
      expect(() => mevBoostRelayIds(Network.Hoodi, relay)).to.throw();
    });
  }

  it("does not use Hoodi presets on any other network", () => {
    for (const network of Object.values(Network).filter((value) => value !== Network.Hoodi))
      expect(mevBoostRelayIds(network, legacyUrl("hoodi.aestus.live"))).to.deep.equal([]);
  });
});

describe("MEV-Boost builder handoff", () => {
  let enabled: boolean;
  let installed: Set<string>;
  let installing: Set<string>;
  let composes: Record<string, ComposeEditor>;
  let writes: Parameters<NonNullable<Parameters<typeof migrateMevBoostRelays>[1]>["setEnvironment"]>[0][];
  let warnings: string[];
  let deps: NonNullable<Parameters<typeof migrateMevBoostRelays>[1]>;

  beforeEach(() => {
    enabled = true;
    installed = new Set([MevBoostHoodi.Mevboost, SignerHoodi.Web3signer]);
    installing = new Set();
    writes = [];
    warnings = [];
    composes = {
      [MevBoostHoodi.Mevboost]: new ComposeEditor(
        {
          services: {
            "mev-boost": {
              image: "mev-boost:test",
              environment: {
                RELAYS: legacyUrl("hoodi.aestus.live"),
                EXTRA_OPTS: "--min-bid 0.1"
              }
            }
          }
        },
        { dnpName: MevBoostHoodi.Mevboost }
      ),
      [SignerHoodi.Web3signer]: new ComposeEditor(
        {
          services: {
            brain: { image: "brain:test", environment: { NETWORK: "hoodi", OTHER: "keep" }, volumes: ["data:/data"] },
            web3signer: { image: "web3signer:test", environment: { JAVA_OPTS: "keep" } }
          },
          volumes: { data: {} }
        },
        { dnpName: SignerHoodi.Web3signer }
      )
    };
    deps = {
      isEnabled: () => enabled,
      isInstalled: async (name) => installed.has(name),
      isInstalling: (name) => installing.has(name),
      getEnvironment: (name) => composes[name].getUserSettings().environment,
      setEnvironment: async (args) => {
        writes.push(args);
        composes[args.dnpName].services().brain.mergeEnvs(args.environmentByService.brain);
      },
      warn: (message) => {
        warnings.push(message);
      }
    };
  });

  const run = (deps: NonNullable<Parameters<typeof migrateMevBoostRelays>[1]>) =>
    migrateMevBoostRelays(Network.Hoodi, deps);

  it("sets only brain.BUILDER_IDS, preserving all settings and the original MEV-Boost configuration", async () => {
    const source = structuredClone(composes[MevBoostHoodi.Mevboost].compose);
    const target = structuredClone(composes[SignerHoodi.Web3signer].compose);
    await run(deps);
    expect(writes).to.deep.equal([
      {
        dnpName: SignerHoodi.Web3signer,
        environmentByService: { brain: { BUILDER_IDS: "aestus" } }
      }
    ]);
    expect(composes[MevBoostHoodi.Mevboost].compose).to.deep.equal(source);
    expect(composes[SignerHoodi.Web3signer].getUserSettings().environment?.brain).to.deep.equal({
      NETWORK: "hoodi",
      OTHER: "keep",
      BUILDER_IDS: "aestus"
    });
    expect(composes[SignerHoodi.Web3signer].compose.services.web3signer).to.deep.equal(target.services.web3signer);
    expect(composes[SignerHoodi.Web3signer].compose.services.brain.volumes).to.deep.equal(["data:/data"]);
    expect(enabled).to.equal(true);
  });

  it("maps the configured Hoodi relay URLs with their real public keys to ordered preset IDs", async () => {
    const relays = [
      "https://0x98f0ef62f00780cf8eb06701a7d22725b9437d4768bb19b363e882ae87129945ec206ec2dc16933f31d983f8225772b6@hoodi.aestus.live",
      "https://0xaa58208899c6105603b74396734a6263cc7d947f444f396a90f7b7d3e65d102aec7e5e5291b27e08d02c50a050825c2f@hoodi.titanrelay.xyz",
      "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@boost-relay-hoodi.flashbots.net"
    ].join(",");
    composes[MevBoostHoodi.Mevboost].services()["mev-boost"].mergeEnvs({ RELAYS: relays });

    await run(deps);

    expect(writes).to.deep.equal([
      {
        dnpName: SignerHoodi.Web3signer,
        environmentByService: { brain: { BUILDER_IDS: "aestus,titan,flashbots" } }
      }
    ]);
    expect(composes[MevBoostHoodi.Mevboost].services()["mev-boost"].getEnvs().RELAYS).to.equal(relays);
    expect(warnings).to.deep.equal([]);
  });

  it("skips disabled MEV-Boost and unsupported networks", async () => {
    enabled = false;
    await run(deps);
    enabled = true;
    for (const network of Object.values(Network).filter((value) => value !== Network.Hoodi))
      await migrateMevBoostRelays(network, deps);
    expect(writes).to.have.length(0);
  });

  for (const name of [MevBoostHoodi.Mevboost, SignerHoodi.Web3signer]) {
    it(`retries when missing ${name} becomes available`, async () => {
      installed.delete(name);
      await run(deps);
      expect(writes).to.have.length(0);
      installed.add(name);
      await run(deps);
      expect(writes).to.have.length(1);
    });

    it(`defers while ${name} is being installed`, async () => {
      installing.add(name);
      await run(deps);
      expect(writes).to.have.length(0);
      installing.delete(name);
      await run(deps);
      expect(writes).to.have.length(1);
    });
  }

  it("skips packages without the corresponding services or a relay selection", async () => {
    delete composes[SignerHoodi.Web3signer].compose.services.brain;
    await run(deps);
    composes[SignerHoodi.Web3signer].compose.services.brain = { image: "brain:test" };
    delete composes[MevBoostHoodi.Mevboost].compose.services["mev-boost"];
    await run(deps);
    composes[MevBoostHoodi.Mevboost].compose.services["mev-boost"] = {
      image: "mev-boost:test",
      environment: { RELAYS: " , , " }
    };
    await run(deps);
    expect(writes).to.have.length(0);
  });

  it("logs a concise explanation and stages nothing for unknown or mixed selections", async () => {
    for (const relays of ["https://hoodi.blxrbdn.com", `${legacyUrl("hoodi.aestus.live")},https://hoodi.blxrbdn.com`]) {
      composes[MevBoostHoodi.Mevboost].services()["mev-boost"].mergeEnvs({ RELAYS: relays });
      await run(deps);
    }
    expect(writes).to.have.length(0);
    expect(warnings).to.have.length(2);
    expect(warnings[0]).to.contain("hoodi").and.contain("unsupported relay endpoint");
    expect(warnings.join()).not.to.contain("0x");
  });

  it("preserves a nonempty staged list exactly, even if source selections change", async () => {
    composes[SignerHoodi.Web3signer].services().brain.mergeEnvs({ BUILDER_IDS: " titan, flashbots " });
    const staged = structuredClone(composes[SignerHoodi.Web3signer].compose);
    composes[MevBoostHoodi.Mevboost].services()["mev-boost"].mergeEnvs({ RELAYS: "https://hoodi.titanrelay.xyz" });
    await run(deps);
    expect(writes).to.have.length(0);
    expect(composes[SignerHoodi.Web3signer].compose).to.deep.equal(staged);
  });

  it("stages over an empty list and avoids recreating on repeated or concurrent runs", async () => {
    composes[SignerHoodi.Web3signer].services().brain.mergeEnvs({ BUILDER_IDS: " , " });
    await Promise.all([run(deps), run(deps), run(deps)]);
    composes[MevBoostHoodi.Mevboost].services()["mev-boost"].mergeEnvs({ RELAYS: "https://hoodi.titanrelay.xyz" });
    await run(deps);
    expect(writes).to.have.length(1);
    expect(composes[SignerHoodi.Web3signer].services().brain.getEnvs().BUILDER_IDS).to.equal("aestus");
  });

  it("allows a later attempt after a failed package operation", async () => {
    try {
      await run({
        ...deps,
        setEnvironment: async () => {
          throw Error("package unavailable");
        }
      });
      expect.fail("expected package error");
    } catch (e) {
      expect((e as Error).message).to.equal("package unavailable");
    }
    await run(deps);
    expect(writes).to.have.length(1);
  });
});
