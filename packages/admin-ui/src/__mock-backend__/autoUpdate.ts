import { AutoUpdateDataView, Routes } from "@dappnode/types";
import { pause } from "./utils/pause";

export const autoUpdate: Pick<Routes, "autoUpdateDataGet" | "autoUpdateSettingsEdit"> = {
  autoUpdateDataGet: async () => autoUpdateData,
  autoUpdateSettingsEdit: async ({ id, enabled, applyToAll }) => {
    await pause(500);
    const isSinglePackage = id !== "system-packages" && id !== "my-packages";
    const defaultEnabled = Boolean(autoUpdateData.settings["my-packages"]?.enabled);
    if (isSinglePackage && enabled === defaultEnabled) delete autoUpdateData.settings[id];
    else autoUpdateData.settings[id] = { enabled };

    if (id === "my-packages" && applyToAll !== false) {
      for (const settingId of Object.keys(autoUpdateData.settings)) {
        if (settingId !== "system-packages" && settingId !== "my-packages") delete autoUpdateData.settings[settingId];
      }
    }

    for (const dnp of autoUpdateData.dnpsToShow) {
      const usesDefault = dnp.id !== "system-packages" && dnp.id !== "my-packages" && !autoUpdateData.settings[dnp.id];
      if (
        dnp.id === id ||
        (id === "my-packages" && dnp.id !== "system-packages" && (applyToAll !== false || usesDefault))
      )
        dnp.enabled = enabled;
    }
  }
};

const coreName = "core.dnp.dappnode.eth";

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
      displayName: "Default for my packages",
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
        errorMessage: "More lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum"
      }
    }
  ]
};
