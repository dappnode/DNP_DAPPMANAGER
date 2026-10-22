import { expect } from "chai";
import { eventBus } from "@dappnode/eventbus";
import { afterInstall, flagPackagesAreInstalling, packageIsInstalling } from "@dappnode/installer";
import { MevBoostHoodi, Network, SignerHoodi, SignerMainnet, UserSettings } from "@dappnode/types";
import { migrateMevBoostRelays, startMevBoostRelayMigration } from "../../src/migrateMevBoostRelays.js";

describe("migration package lifecycle builder import", () => {
  it("retries a missing signer after installation and stops recreating after staging", async () => {
    let signerInstalled = false;
    let staged: string | undefined;
    let recreations = 0;
    const attempts: Network[] = [];
    const importRelays = (network: Network): Promise<void> => {
      attempts.push(network);
      return migrateMevBoostRelays(network, {
        isEnabled: () => true,
        isInstalled: async (name) => name === MevBoostHoodi.Mevboost || signerInstalled,
        isInstalling: packageIsInstalling,
        getEnvironment: (name): UserSettings["environment"] =>
          name === MevBoostHoodi.Mevboost
            ? { "mev-boost": { RELAYS: "https://hoodi.aestus.live" } }
            : { brain: staged ? { BUILDER_IDS: staged } : {} },
        setEnvironment: async ({ dnpName, environmentByService }) => {
          staged = environmentByService.brain.BUILDER_IDS;
          recreations++;
          eventBus.packagesModified.emit({ dnpNames: [dnpName] });
        },
        warn: (message) => {
          throw Error(message);
        }
      });
    };

    await startMevBoostRelayMigration(Network.Hoodi, importRelays);
    expect(staged).to.equal(undefined);
    // Repeated startup calls must not register duplicate event listeners.
    await startMevBoostRelayMigration(Network.Hoodi, importRelays);
    eventBus.packagesModified.emit({ dnpNames: [SignerMainnet.Web3signer] });
    eventBus.packagesModified.emit({ dnpNames: [SignerHoodi.Web3signer], removed: true });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(attempts).to.deep.equal([Network.Hoodi, Network.Hoodi]);
    expect(staged).to.equal(undefined);

    signerInstalled = true;
    flagPackagesAreInstalling([SignerHoodi.Web3signer]);
    // afterInstall emits before clearing the installing flag. The queued import
    // must run after it clears, even though migrations and daemons overlap.
    await afterInstall([SignerHoodi.Web3signer]);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(staged).to.equal("aestus");
    expect(recreations).to.equal(1);
    // Two startup calls, Hoodi installation, and our own event. Mainnet events are ignored.
    expect(attempts).to.deep.equal([Network.Hoodi, Network.Hoodi, Network.Hoodi, Network.Hoodi]);

    eventBus.packagesModified.emit({ dnpNames: [SignerHoodi.Web3signer] });
    eventBus.packagesModified.emit({ dnpNames: [MevBoostHoodi.Mevboost] });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(recreations).to.equal(1);
  });
});
