import { VolumeData } from "../../src/types";
import { pause } from "../utils";
import { dnpInstalled } from "../data";
import * as eventBus from "../eventBus";

let volumes: VolumeData[] = [
  {
    name: "gethdnpdappnodeeth_data",
    owner: undefined,
    users: ["geth.dnp.dappnode.eth"],
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
    users: ["lightning-network.public.dappnode.eth"],
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
    users: [],
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
    users: ["parity.dnp.dappnode.eth"],
    size: 71570000000,
    createdAt: 1569146006000,
    mountpoint: "",
    isOrphan: false
  },
  {
    name: "paritydnpdappnodeeth_geth",
    owner: "parity.dnp.dappnode.eth",
    users: ["parity.dnp.dappnode.eth"],
    size: 94620000000,
    createdAt: 1569146006000,
    mountpoint: "",
    isOrphan: false
  }
];

for (const dnp of dnpInstalled) {
  for (const container of dnp.containers) {
    for (const vol of container.volumes) {
      if (vol.name && !volumes.find(v => v.name === vol.name)) {
        volumes.push({
          name: vol.name,
          owner: dnp.dnpName,
          users: [dnp.dnpName],
          size: 71570000000 * Math.random(),
          createdAt: 1569146006000 + 100000000 * Math.random(),
          mountpoint: "",
          isOrphan: false
        });
      }
    }
  }
}

/**
 * Removes a docker volume by name
 * @param name Full volume name: "bitcoindnpdappnodeeth_bitcoin_data"
 */
export async function volumeRemove({ name }: { name: string }): Promise<void> {
  await pause(1000);
  volumes = volumes.filter(v => v.name !== name);
  eventBus.requestPackages.emit();
}

/**
 * Returns volume data
 */
export async function volumesGet(): Promise<VolumeData[]> {
  return volumes;
}
