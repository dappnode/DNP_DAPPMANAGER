import {
  AutoUpdateDataView,
  PackageBackup,
  Diagnose,
  EthClientFallback,
  EthClientTarget,
  CoreUpdateData,
  DirectoryItem,
  HostStats,
  RequestedDnp,
  MountpointData,
  NewFeatureId,
  NewFeatureStatus,
  PackageNotificationDb,
  PackageNotification,
  PackageDetailData,
  SystemInfo,
  PortMapping,
  VolumeData,
  UserActionLog
} from "../../src/common";
import { coreName } from "../mockData";

/**
 * Returns formated auto-update data
 */
export async function autoUpdateDataGet(): Promise<AutoUpdateDataView> {
  return {
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
}

/**
 * Edits the auto-update settings
 * @param id = "my-packages", "system-packages" or "bitcoin.dnp.dappnode.eth"
 * @param enabled Auto update is enabled for ID
 */
export async function autoUpdateSettingsEdit(kwargs: {
  id: string;
  enabled: boolean;
}): Promise<void> {
  //
}

/**
 * Generates a backup of a package and sends it to the client for download.
 * @param id DNP .eth name
 * @param backup Backup definition
 * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
 */
export async function backupGet(kwargs: {
  id: string;
  backup: PackageBackup[];
}): Promise<string> {
  return "";
}

/**
 * Restores a backup of a package from the dataUri provided by the user
 * @param id DNP .eth name
 * @param backup Backup definition
 * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
 */
export async function backupRestore(kwargs: {
  id: string;
  backup: PackageBackup[];
  fileId: string;
}): Promise<void> {
  //
}

/**
 * Used to test different IPFS timeout parameters live from the ADMIN UI.
 * @param timeout new IPFS timeout in ms
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
 * Copy file from a DNP and downloaded on the client
 * @param id DNP .eth name
 * @param fromPath path to copy file from
 * - If path = path to a file: "/usr/src/app/config.json".
 *   Downloads and sends that file
 * - If path = path to a directory: "/usr/src/app".
 *   Downloads all directory contents, tar them and send as a .tar.gz
 * - If path = relative path: "config.json".
 *   Path becomes $WORKDIR/config.json, then downloads and sends that file
 *   Same for relative paths to directories.
 * @returns dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 */
export async function copyFileFrom(kwargs: {
  id: string;
  fromPath: string;
}): Promise<string> {
  return "";
}

/**
 * Copy file to a DNP:
 * @param id DNP .eth name
 * @param dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 * @param filename name of the uploaded file.
 * - MUST NOT be a path: "/app", "app/", "app/file.txt"
 * @param toPath path to copy a file to
 * - If path = path to a file: "/usr/src/app/config.json".
 *   Copies the contents of dataUri to that file, overwritting it if necessary
 * - If path = path to a directory: "/usr/src/app".
 *   Copies the contents of dataUri to ${dir}/${filename}
 * - If path = relative path: "config.json".
 *   Path becomes $WORKDIR/config.json, then copies the contents of dataUri there
 *   Same for relative paths to directories.
 * - If empty, defaults to $WORKDIR
 */
export async function copyFileTo(kwargs: {
  id: string;
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

/**
 * Return host machine stats (cpu, memory, etc)
 */
export async function getStats(): Promise<HostStats> {
  return {
    cpu: "35%",
    memory: "46%",
    disk: "57%"
  };
}

/**
 * Returns the list of current mountpoints in the host,
 * by running a pre-written script in the host
 */
export async function mountpointsGet(): Promise<MountpointData[]> {
  return [];
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
 * Returns not viewed notifications.
 * Use an array as the keys are not known in advance and the array form
 * is okay for RPC transport, as uniqueness is guaranteed
 */
export async function notificationsGet(): Promise<PackageNotificationDb[]> {
  return [
    {
      id: "diskSpaceRanOut-stoppedPackages",
      type: "danger",
      title: "Disk space ran out, stopped packages",
      body: "Available disk space gone wrong ".repeat(10),
      timestamp: 153834824,
      viewed: false
    }
  ];
}

/**
 * Marks notifications as view by deleting them from the db
 * @param ids Array of ids to be marked as read [ "n-id-1", "n-id-2" ]
 */
export async function notificationsRemove(kwargs: {
  ids: string[];
}): Promise<void> {
  //
}

/**
 * Adds a notification to be shown the UI.
 * Set the notification param to null for a random notification
 */
export async function notificationsTest(kwargs: {
  notification?: PackageNotification;
}): Promise<void> {
  //
}

/**
 * Changes the user `dappnode`'s password in the host machine
 * Only allows it if the current password has the salt `insecur3`
 */
export async function passwordChange(kwargs: {
  newPassword: string;
}): Promise<void> {
  //
}

/**
 * Checks if the user `dappnode`'s password in the host machine
 * is NOT the insecure default set at installation time.
 * It does so by checking if the current salt is `insecur3`
 *
 * - This check will be run every time this node app is started
 *   - If the password is SECURE it will NOT be run anymore
 *     and this call will return true always
 *   - If the password is INSECURE this check will be run every
 *     time the admin requests it (on page load)
 *
 * @returns true = is secure / false = is not
 */
export async function passwordIsSecure(): Promise<boolean> {
  return true;
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
 * Requests chain data. Also instructs the DAPPMANAGER
 * to keep sending data for a period of time (5 minutes)
 */
export async function requestChainData(): Promise<void> {
  //
}

/**
 * Receives an encrypted message containing the seed phrase of
 * 12 word mnemonic ethereum account. The extra layer of encryption
 * slightly increases the security of the exchange while the WAMP
 * module works over HTTP.
 * @param seedPhraseEncrypted tweetnacl base64 box with nonce
 */
export async function seedPhraseSet(kwargs: {
  seedPhraseEncrypted: string;
}): Promise<void> {
  //
}

/**
 * Sets the static IP
 * @param staticIp New static IP. To enable: "85.84.83.82", disable: ""
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

/**
 * Updates a package port mappings
 */
export async function updatePortMappings(kwargs: {
  id: string;
  portMappings: PortMapping[];
  options?: { merge: boolean };
}): Promise<void> {
  //
}

/**
 * Removes a docker volume by name
 * @param name Full volume name: "bitcoindnpdappnodeeth_bitcoin_data"
 */
export async function volumeRemove(kwargs: { name: string }): Promise<void> {
  //
}

/**
 * Returns volume data
 */
export async function volumesGet(): Promise<VolumeData[]> {
  return [
    {
      name: "gethdnpdappnodeeth_data",
      owner: undefined,
      nameDisplay: "data",
      ownerDisplay: "gethdnpdappnodeeth",
      createdAt: 1569346006000,
      mountpoint: "",
      size: 161254123,
      refCount: 0,
      isOrphan: true
    },
    {
      name: "lightning-networkpublicdappnodeeth_data",
      owner: "lightning-network.public.dappnode.eth",
      nameDisplay: "data",
      ownerDisplay: "lightning-networkpublicdappnodeeth",
      createdAt: 1569146006000,
      mountpoint: "/media/usb0",
      size: 0,
      fileSystem: {
        mountpoint: "/media/usb0",
        use: "89%",
        used: 198642520,
        total: 235782040,
        free: 25092776,
        vendor: "SanDisk",
        model: "Ultra_USB_3.0"
      },
      refCount: 2,
      isOrphan: false
    },
    {
      name: "d19f0771fe2e5b813cf0d138a77eddc33ae3fd6afc1cc6daf0fba42ed73e36ae",
      owner: undefined,
      nameDisplay: "",
      ownerDisplay: "",
      createdAt: 1569306006000,
      mountpoint: "",
      size: 24,
      refCount: 0,
      isOrphan: true
    }
  ];
}
