import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { packageIsInstalling, packageSetEnvironment } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import { MevBoostHoodi, Network, SignerHoodi } from "@dappnode/types";

// Keep networks independent: an absent catalog means there is nothing to import.
const handoffs: Partial<
  Record<Network, { mevBoost: string; signer: string; enabled: () => boolean; presets: Record<string, string> }>
> = {
  [Network.Hoodi]: {
    mevBoost: MevBoostHoodi.Mevboost,
    signer: SignerHoodi.Web3signer,
    enabled: () => db.mevBoostHoodi.get(),
    presets: {
      "hoodi.aestus.live": "aestus",
      "boost-relay-hoodi.flashbots.net": "flashbots",
      "builder-hoodi.nflaig.dev": "nflaig",
      "hoodi.titanrelay.xyz": "titan",
      "relay-hoodi.ultrasound.money": "ultrasound",
      "builder-hoodi.pk910.de": "pk910"
    }
  }
};

/** Translate the entire selection or reject it; relay public keys are never passed to Brain. */
export function mevBoostRelayIds(network: Network, relays: string): string[] {
  const presets = handoffs[network]?.presets;
  if (!presets) return [];

  const ids = new Set<string>();
  for (const relay of relays
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)) {
    let url: URL;
    try {
      url = new URL(relay);
    } catch {
      throw Error("invalid relay URL");
    }
    // Match the known endpoint, allowing legacy userinfo and an equivalent root slash.
    const id = Object.hasOwn(presets, url.hostname) ? presets[url.hostname] : undefined;
    if (url.protocol !== "https:" || url.port || url.pathname !== "/" || url.search || url.hash || !id)
      throw Error(`unsupported relay endpoint (${url.hostname})`);
    ids.add(id);
  }
  return [...ids];
}

const dependencies = {
  isEnabled: (network: Network): boolean => handoffs[network]?.enabled() ?? false,
  isInstalled: async (dnpName: string): Promise<boolean> => Boolean(await listPackageNoThrow({ dnpName })),
  isInstalling: packageIsInstalling,
  getEnvironment: (dnpName: string) => new ComposeFileEditor(dnpName, false).getUserSettings().environment,
  setEnvironment: packageSetEnvironment,
  warn: (message: string): void => {
    logs.warn(message);
  }
};

const retryNetworks = new Set<Network>();

/** Register lifecycle retries before attempting the startup handoff. */
export async function startMevBoostRelayMigration(
  network: Network,
  migrate: (network: Network) => Promise<void> = migrateMevBoostRelays
): Promise<void> {
  const config = handoffs[network];
  if (!config) return;
  if (!retryNetworks.has(network)) {
    retryNetworks.add(network);
    eventBus.packagesModified.on(({ dnpNames, removed }) => {
      if (!removed && dnpNames.some((name) => name === config.signer || name === config.mevBoost))
        migrate(network).catch((e) => logs.error(`Error staging ${network} MEV-Boost builder import`, e));
    });
  }
  await migrate(network);
}

// Startup and package lifecycle events can overlap. Serialize attempts, including
// the packagesModified event emitted by packageSetEnvironment itself.
let pendingHandoff: Promise<void> = Promise.resolve();

export function migrateMevBoostRelays(network: Network, deps = dependencies): Promise<void> {
  const attempt = pendingHandoff
    .catch(() => undefined)
    .then(async () => {
      const config = handoffs[network];
      if (!config || !deps.isEnabled(network)) return;
      if (deps.isInstalling(config.mevBoost) || deps.isInstalling(config.signer)) return;
      if (!(await deps.isInstalled(config.mevBoost)) || !(await deps.isInstalled(config.signer))) return;

      const brain = deps.getEnvironment(config.signer)?.brain;
      // Never provision a fresh signer or overwrite a previously staged handoff.
      if (!brain || brain.BUILDER_IDS?.split(",").some((id) => id.trim())) return;

      const relays = deps.getEnvironment(config.mevBoost)?.["mev-boost"]?.RELAYS;
      if (!relays) return;
      let ids: string[];
      try {
        ids = mevBoostRelayIds(network, relays);
      } catch (e) {
        deps.warn(`Skipping MEV-Boost builder import for ${network}: ${e.message}`);
        return;
      }
      if (ids.length === 0) return;

      await deps.setEnvironment({
        dnpName: config.signer,
        environmentByService: { brain: { BUILDER_IDS: ids.join(",") } }
      });
    });
  pendingHandoff = attempt;
  return attempt;
}
