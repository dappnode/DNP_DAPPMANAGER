import {
  PackageBackup,
  Diagnose,
  EthClientFallback,
  EthClientTarget,
  MountpointData,
  NewFeatureId,
  NewFeatureStatus,
  SystemInfo,
  HostStatCpu,
  HostStatDisk,
  HostStatMemory,
  PublicIpResponse,
  ChainData
} from "../common";

/**
 * Generates a backup of a package and sends it to the client for download.
 * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
 */
export async function backupGet(kwargs: {
  dnpName: string;
  backup: PackageBackup[];
}): Promise<string> {
  return "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc";
}

/**
 * Restores a backup of a package from the dataUri provided by the user
 * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
 */
export async function backupRestore(kwargs: {
  dnpName: string;
  backup: PackageBackup[];
  fileId: string;
}): Promise<void> {
  //
}

export async function chainDataGet(): Promise<ChainData[]> {
  return [
    {
      dnpName: "geth.dnp.dappnode.eth",
      syncing: true,
      error: false,
      message: [
        "Blocks synced: 543000 / 654000",
        "States pulled: 25314123 / 154762142"
      ].join("\n\n"),
      help: "http://geth.io"
    },
    {
      dnpName: "rinkeby.dnp.dappnode.eth",
      syncing: true,
      error: false,
      message: "Blocks synced: 543000 / 654000",
      progress: 0.83027522935
    }
  ];
}

/**
 * Used to test different IPFS timeout parameters live from the ADMIN UI.
 */
export async function changeIpfsTimeout(kwargs: {
  timeout: number;
}): Promise<void> {
  //
}

/**
 * Cleans the cache files of the DAPPMANAGER:
 */
export async function cleanCache(): Promise<void> {
  //
}

/**
 * Copy file to a DNP:
 */
export async function copyFileTo(kwargs: {
  containerName: string;
  dataUri: string;
  filename: string;
  toPath: string;
}): Promise<void> {
  //
}

/**
 * Run system diagnose to inform the user
 */
export async function diagnose(): Promise<Diagnose> {
  return [];
}

/**
 * Set a domain alias to a DAppNode package by name
 */
export async function domainAliasSet(kwargs: {
  alias: string;
  dnpName: string;
}): Promise<void> {
  //
}

/**
 * Sets if a fallback should be used
 */
export async function ethClientFallbackSet(kwargs: {
  fallback: EthClientFallback;
}): Promise<void> {
  //
}

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ethClientTargetSet(kwargs: {
  target: EthClientTarget;
  deleteVolumes?: boolean;
}): Promise<void> {
  //
}

export async function statsCpuGet(): Promise<HostStatCpu> {
  // await new Promise(() => {});
  return {
    usedPercentage: 88
  };
}

export async function statsMemoryGet(): Promise<HostStatMemory> {
  // throw Error("Ups");
  return {
    total: 8093155328,
    used: 6535839744,
    free: 179961856,
    usedPercentage: 34
  };
}

export async function statsDiskGet(): Promise<HostStatDisk> {
  return {
    total: 241440808960,
    used: 189458415616,
    free: 39646527488,
    usedPercentage: 83
  };
}

/**
 * Returns the list of current mountpoints in the host,
 * by running a pre-written script in the host
 */
export async function mountpointsGet(): Promise<MountpointData[]> {
  return [
    {
      mountpoint: "",
      use: "87%",
      used: 43e9,
      total: 0,
      free: 121e9,
      vendor: "Host",
      model: "(default)"
    },
    {
      mountpoint: "/data",
      use: "68%",
      used: 380e9,
      total: 500e9,
      free: 141e9,
      vendor: "ATA",
      model: "CT500MX500SSD4"
    },
    {
      mountpoint: "/media/usb0",
      use: "89%",
      used: 198642520,
      total: 235782040,
      free: 25092776,
      vendor: "SanDisk",
      model: "Ultra_USB_3.0"
    },
    {
      mountpoint: "/media/usb1",
      use: "100%",
      used: 4e9,
      total: 16e9,
      free: 7.1e9,
      vendor: "SanDisk",
      model: "Ultra_USB_3.0"
    }
  ];
}

/**
 * Flag the UI welcome flow as completed
 */
export async function newFeatureStatusSet(kwargs: {
  featureId: NewFeatureId;
  status: NewFeatureStatus;
}): Promise<void> {
  //
}

/**
 * Shuts down the host machine via the DBus socket
 */
export async function poweroffHost(): Promise<void> {
  //
}

/**
 * Reboots the host machine via the DBus socket
 */
export async function rebootHost(): Promise<void> {
  //
}

/**
 * Receives an encrypted message containing the seed phrase of
 * 12 word mnemonic ethereum account. The extra layer of encryption
 * slightly increases the security of the exchange while the WAMP
 * module works over HTTP.
 */
export async function seedPhraseSet(kwargs: {
  seedPhraseEncrypted: string;
}): Promise<void> {
  //
}

/**
 * Sets the static IP
 */
export async function setStaticIp(kwargs: { staticIp: string }): Promise<void> {
  //
}

/**
 * Returns the current DAppNode system info
 */
export async function systemInfoGet(): Promise<SystemInfo> {
  return {
    versionData: {
      branch: "test",
      commit: "a5a5a5a5",
      version: "0.2.0"
    },
    versionDataVpn: {
      branch: "test",
      commit: "a8a8a8a8",
      version: "0.2.1"
    },
    ip: "85.84.83.82",
    name: "My-DAppNode",
    staticIp: "", // "85.84.83.82",
    domain: "1234acbd.dyndns.io",
    upnpAvailable: true,
    noNatLoopback: false,
    alertToOpenPorts: false,
    internalIp: "192.168.0.1",
    publicIp: "85.84.83.82",
    dappmanagerNaclPublicKey: "cYo1NA7/+PQ22PeqrRNGhs1B84SY/fuomNtURj5SUmQ=",
    identityAddress: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    ethClientTarget: "openethereum",
    ethClientFallback: "off",
    ethClientStatus: {
      ok: false,
      code: "STATE_CALL_ERROR",
      error: { message: "Some Error", stack: "Some Error\nline 56 file.ts" }
    },
    ethProvider: "http://geth.dappnode:8545",
    fullnodeDomainTarget: "geth.dnp.dappnode.eth",
    newFeatureIds: [
      // "repository",
      // "repository-fallback",
      // "system-auto-updates",
      // "change-host-password"
    ]
  };
}

export async function ipPublicGet(): Promise<PublicIpResponse> {
  return {
    publicIp: "85.84.83.82"
  };
}
