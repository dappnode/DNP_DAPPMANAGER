import { pause } from "./utils/pause";
import { dnpInstalled } from "./data";
import { VolumeData, Routes } from "@dappnode/common";

const volumesState = new Map<string, VolumeData>(
  getInitialVolumes().map(vol => [vol.name, vol])
);

export const volumes: Pick<Routes, "volumeRemove" | "volumesGet"> = {
  volumeRemove: async ({ name }) => {
    await pause(1000);
    volumesState.delete(name);
  },
  volumesGet: async () => Array.from(volumesState.values())
};

/**
 * Generate list of volumes from some random volumes
 * + all volumes of dnpInstalled packages
 */
function getInitialVolumes(): VolumeData[] {
  const initialVolumes: VolumeData[] = [
    {
      name: "gethdnpdappnodeeth_data",
      owner: undefined,
      internalName: "data",
      createdAt: 1569346006000,
      mountpoint: "",
      size: 161254123,
      refCount: 0,
      isOrphan: true
    },
    {
      name: "lightning-networkpublicdappnodeeth_data",
      owner: "lightning-network.public.dappnode.eth",
      internalName: "data",
      createdAt: 1569146006000,
      mountpoint: "/media/usb0",
      size: 0,
      refCount: 2,
      isOrphan: false
    },
    {
      name: "d19f0771fe2e5b813cf0d138a77eddc33ae3fd6afc1cc6daf0fba42ed73e36ae",
      owner: undefined,
      internalName: "",
      createdAt: 1569306006000,
      mountpoint: "",
      size: 24,
      refCount: 0,
      isOrphan: true
    },
    {
      name: "paritydnpdappnodeeth_data",
      owner: "parity.dnp.dappnode.eth",
      size: 71570000000,
      createdAt: 1569146006000,
      mountpoint: "",
      isOrphan: false
    },
    {
      name: "paritydnpdappnodeeth_geth",
      owner: "parity.dnp.dappnode.eth",
      size: 94620000000,
      createdAt: 1569146006000,
      mountpoint: "",
      isOrphan: false
    }
  ];

  for (const dnp of dnpInstalled) {
    for (const container of dnp.containers) {
      for (const vol of container.volumes) {
        if (vol.name) {
          initialVolumes.push({
            name: vol.name,
            owner: dnp.dnpName,
            size: 71570000000 * Math.random(),
            createdAt: 1569146006000 + 100000000 * Math.random(),
            mountpoint: "",
            isOrphan: false
          });
        }
      }
    }
  }

  return initialVolumes;
}
