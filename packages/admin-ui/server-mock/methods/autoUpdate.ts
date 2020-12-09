import { AutoUpdateDataView } from "../../src/common";
import { coreName } from "../mockData";
import { pause } from "../utils";
import { eventBus } from "../eventBus";

const autoUpdateData: AutoUpdateDataView = {
  settings: {
    "system-packages": { enabled: true },
    "my-packages": { enabled: true },
    "bitcoin.dnp.dappnode.eth": { enabled: false },
    "lightning-network.dnp.dappnode.eth": { enabled: true }
  },
  registry: {
    [coreName]: {
      "0.2.4": { updated: 1563304834738, successful: true },
      "0.2.5": { updated: 1563304834738, successful: false }
    },
    "bitcoin.dnp.dappnode.eth": {
      "0.1.1": { updated: 1563304834738, successful: true },
      "0.1.2": { updated: 1563304834738, successful: true }
    },
    "lightning-network.dnp.dappnode.eth": {
      "0.1.1": { updated: 1565284039677, successful: true }
    }
  },
  pending: {
    [coreName]: {
      version: "0.2.4",
      firstSeen: 1563218436285,
      scheduledUpdate: 1563304834738,
      completedDelay: true
    },
    "bitcoin.dnp.dappnode.eth": {
      version: "0.1.2",
      firstSeen: 1563218436285,
      scheduledUpdate: 1563304834738,
      completedDelay: false
    }
  },

  dnpsToShow: [
    {
      id: "system-packages",
      displayName: "System packages",
      enabled: true,
      feedback: { scheduled: 1566645310441 }
    },
    {
      id: "my-packages",
      displayName: "My packages",
      enabled: true,
      feedback: {}
    },
    {
      id: "bitcoin.dnp.dappnode.eth",
      displayName: "Bitcoin",
      enabled: false,
      feedback: { updated: 1563304834738 }
    },
    {
      id: "lightning-network.dnp.dappnode.eth",
      displayName: "LN",
      enabled: true,
      feedback: {
        inQueue: true,
        errorMessage:
          "More lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum"
      }
    }
  ]
};

/**
 * Returns formated auto-update data
 */
export async function autoUpdateDataGet(): Promise<AutoUpdateDataView> {
  return autoUpdateData;
}

/**
 * Edits the auto-update settings
 * @param id = "my-packages", "system-packages" or "bitcoin.dnp.dappnode.eth"
 * @param enabled Auto update is enabled for ID
 */
export async function autoUpdateSettingsEdit({
  id,
  enabled
}: {
  id: string;
  enabled: boolean;
}): Promise<void> {
  await pause(500);
  if (autoUpdateData.settings[id])
    autoUpdateData.settings[id].enabled = enabled;

  for (const dnp of autoUpdateData.dnpsToShow) {
    if (dnp.id === id) dnp.enabled = enabled;
  }

  eventBus.requestAutoUpdateData.emit();
}
