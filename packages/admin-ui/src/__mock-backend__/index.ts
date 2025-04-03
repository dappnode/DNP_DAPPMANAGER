import {
  ConsensusClientMainnet,
  ExecutionClientMainnet,
  IpfsClientTarget,
  PortProtocol,
  Routes
} from "@dappnode/types";
import { autoUpdate } from "./autoUpdate";
import { devices } from "./devices";
import { fetchPkgsData } from "./fetchPkgsData";
import { httpsPortal } from "./httpsPortal";
import { localProxying } from "./localProxying";
import { notifications } from "./notifications";
import { packages } from "./packages";
import { password } from "./password";
import { ssh } from "./ssh";
import { telegram } from "./telegram";
import { userActionLogs } from "./userActionLogs";
import { volumes } from "./volumes";
import { wireguard } from "./wireguard";
import { wifi } from "./wifi";
import { releaseTrustedKey } from "./releaseTrustedKey";
import { stakerConfig } from "./stakerConfig";

const namedSpacedCalls = {
  ...autoUpdate,
  ...devices,
  ...fetchPkgsData,
  ...httpsPortal,
  ...localProxying,
  ...notifications,
  ...packages,
  ...password,
  ...releaseTrustedKey,
  ...ssh,
  ...stakerConfig,
  ...telegram,
  ...userActionLogs,
  ...volumes,
  ...wireguard,
  ...wifi
};

const dappnodeWebName = "Mock-DAppNode";

export const otherCalls: Omit<Routes, keyof typeof namedSpacedCalls> = {
  backupGet: async () => "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc",
  backupRestore: async () => {},
  chainDataGet: async () => [
    {
      dnpName: "geth.dnp.dappnode.eth",
      syncing: true,
      error: false,
      message: ["Blocks synced: 543000 / 654000", "States pulled: 25314123 / 154762142"].join("\n\n"),
      help: "http://geth.io"
    },
    {
      dnpName: "rinkeby.dnp.dappnode.eth",
      syncing: true,
      error: false,
      message: "Blocks synced: 543000 / 654000",
      progress: 0.83027522935
    }
  ],
  changeIpfsTimeout: async () => {},
  cleanCache: async () => {},
  cleanDb: async () => {},
  copyFileToDockerContainer: async () => {},
  diagnose: async () => [],
  ethClientFallbackSet: async () => {},
  ethClientTargetSet: async () => {},
  getHostUptime: async () => "1 week, 1 day, 5 hours, 10 minutes",
  ipfsTest: async () => {},
  ipPublicGet: async () => ({
    publicIp: "85.84.83.82"
  }),

  packageSentDataDelete: async () => {},

  portsToOpenGet: async () => [
    {
      portNumber: 8092,
      protocol: PortProtocol.TCP,
      serviceName: "vpn.dnp.dappnode.eth",
      dnpName: "DAppNodeCore-vpn.dnp.dappnode.eth"
    },
    {
      portNumber: 1194,
      protocol: PortProtocol.UDP,
      serviceName: "vpn.dnp.dappnode.eth",
      dnpName: "DAppNodeCore-vpn.dnp.dappnode.eth"
    }
  ],
  portsUpnpStatusGet: async () => [
    {
      port: 8092,
      protocol: PortProtocol.UDP,
      status: "open",
      serviceName: "validator",
      dnpName: "dnp.prysm.eth"
    },
    {
      port: 1194,
      protocol: PortProtocol.TCP,
      status: "open",
      serviceName: "validator",
      dnpName: "dnp.prysm.eth"
    }
  ],
  portsApiStatusGet: async () => [
    {
      port: 8092,
      protocol: PortProtocol.UDP,
      status: "open",
      serviceName: "validator",
      dnpName: "dnp.prysm.eth"
    },
    {
      port: 1194,
      protocol: PortProtocol.TCP,
      status: "open",
      serviceName: "validator",
      dnpName: "dnp.prysm.eth"
    }
  ],
  dappnodeWebNameSet: async () => {},
  statsCpuGet: async () => ({
    usedPercentage: 88,
    numberOfCores: 4,
    temperatureAverage: 40
  }),
  statsMemoryGet: async () => ({
    total: 8093155328,
    used: 6535839744,
    free: 179961856,
    usedPercentage: 34
  }),
  statsDiskGet: async () => ({
    total: 241440808960,
    used: 189458415616,
    free: 39646527488,
    usedPercentage: 83
  }),
  mountpointsGet: async () => [
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
  ],

  newFeatureStatusSet: async () => {},
  poweroffHost: async () => {},
  rebootHost: async () => {},
  rebootHostIsRequiredGet: async () => ({
    rebootRequired: true,
    pkgs: "docker"
  }),
  setStaticIp: async () => {},

  systemInfoGet: async () => ({
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
    dappnodeWebName,
    domain: "1234acbd.dyndns.io",
    upnpAvailable: true,
    noNatLoopback: false,
    alertToOpenPorts: false,
    internalIp: "192.168.0.1",
    publicIp: "85.84.83.82",
    identityAddress: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    ethClientTarget: "nethermind",
    eth2ClientTarget: {
      execClient: ExecutionClientMainnet.Geth,
      consClient: ConsensusClientMainnet.Prysm
    },
    ethClientFallback: "off",
    ethClientStatus: {
      ok: false,
      code: "STATE_CALL_ERROR",
      error: {
        message: "Some Error",
        stack: "Some Error\nline 56 file.ts"
      }
    },
    ethRemoteRpc: "http://remoteNode.dappnode:8545",
    fullnodeDomainTarget: "geth.dnp.dappnode.eth",
    newFeatureIds: [
      //"repository",
      //"repository-fallback",
      //"system-auto-updates",
      //"enable-ethical-metrics",
      //"change-host-password"
    ]
  }),
  natRenewalEnable: async () => {},
  natRenewalIsEnabled: async () => true,
  lvmhardDisksGet: async () => [
    { name: "sda", size: "3.7T" },
    { name: "nvme0n1", size: "3.7T" }
  ],
  lvmVolumeGroupsGet: async () => [{ vg_name: "rootvg", vg_size: "<7.28t" }],
  lvmLogicalVolumesGet: async () => [
    { lv_name: "root", vg_name: "rootvg", lv_size: "<7.28t" },
    { lv_name: "swap_1", vg_name: "rootvg", lv_size: "976.00m" }
  ],
  lvmDiskSpaceExtend: async () => "Successfully extended LVM disk space",
  ipfsClientTargetSet: async () => {},
  ipfsClientTargetGet: async () => ({
    ipfsClientTarget: IpfsClientTarget.remote,
    ipfsGateway: "https://gateway.ipfs.dappnode.io"
  }),
  enableEthicalMetrics: async () => {},
  getEthicalMetricsConfig: async () => ({
    mail: "@example.com",
    enabled: true,
    tgChannelId: null
  }),
  disableEthicalMetrics: async () => {},
  optimismConfigGet: async () => ({
    executionClients: [
      {
        status: "ok",
        dnpName: "op-geth.dnp.dappnode.eth",
        avatarUrl: "",
        isInstalled: true,
        isUpdated: true,
        isRunning: true,
        data: {
          dnpName: "package",
          reqVersion: "0.1.0",
          semVersion: "0.1.0",
          imageFile: {
            hash: "QM..",
            source: "ipfs",
            size: 123
          },
          warnings: {},
          signedSafe: true,
          manifest: {
            name: "geth.dnp.dappnode.eth",
            description: "Go implementation of ethereum. Execution client",
            shortDescription: "Go implementation of ethereum",
            version: "0.1.0"
          }
        },
        isSelected: true,
        enableHistorical: true
      },
      {
        status: "ok",
        dnpName: "op-erigon.dnp.dappnode.eth",
        avatarUrl: "",
        isInstalled: true,
        isUpdated: true,
        isRunning: true,
        data: {
          dnpName: "package",
          reqVersion: "0.1.0",
          semVersion: "0.1.0",
          imageFile: {
            hash: "QM..",
            source: "ipfs",
            size: 123
          },
          warnings: {},
          signedSafe: true,
          manifest: {
            name: "geth.dnp.dappnode.eth",
            description: "Go implementation of ethereum. Execution client",
            shortDescription: "Go implementation of ethereum",
            version: "0.1.0"
          }
        },
        isSelected: false,
        enableHistorical: false
      }
    ],
    rollup: {
      status: "ok",
      dnpName: "op-node.dnp.dappnode.eth",
      avatarUrl: "",
      isInstalled: false,
      isUpdated: false,
      isRunning: true,
      data: {
        dnpName: "package",
        reqVersion: "0.1.0",
        semVersion: "0.1.0",
        imageFile: {
          hash: "QM..",
          source: "ipfs",
          size: 123
        },
        warnings: {},
        signedSafe: true,
        manifest: {
          name: "geth.dnp.dappnode.eth",
          description: "Go implementation of ethereum. Execution client",
          shortDescription: "Go implementation of ethereum",
          version: "0.1.0"
        }
      },
      isSelected: false,
      mainnetRpcUrl: ""
    },
    archive: {
      status: "ok",
      dnpName: "op-l2geth.dnp.dappnode.eth",
      avatarUrl: "",
      isInstalled: false,
      isUpdated: false,
      isRunning: true,
      data: {
        dnpName: "package",
        reqVersion: "0.1.0",
        semVersion: "0.1.0",
        imageFile: {
          hash: "QM..",
          source: "ipfs",
          size: 123
        },
        warnings: {},
        signedSafe: true,
        manifest: {
          name: "geth.dnp.dappnode.eth",
          description: "Go implementation of ethereum. Execution client",
          shortDescription: "Go implementation of ethereum",
          version: "0.1.0"
        }
      },
      isSelected: true
    }
  }),
  optimismConfigSet: async () => {},
  updateUpgrade: async () => "Successfully updated",
  setShouldShownSmooth: async () => {},
  getShouldShowSmooth: async () => true,
  dockerUpgrade: async () => {},
  dockerUpgradeCheck: async () => ({
    isDockerInUnattendedUpgrades: true,
    isDockerInstalledThroughApt: true,
    dockerHostVersion: "20.10.7",
    dockerLatestVersion: "20.10.8"
  }),
  getIsConnectedToInternet: async () => false,
  getCoreVersion: async () => "0.2.92",
  notificationsGetAllEndpoints: async () => {
    return { "geth.dnp.dappnode.eth": { endpoints: [], customEndpoints: [], isCore: false } };
  },
  notificationsUpdateEndpoints: async () => {},
  notificationsGetAll: async () => []
};

export const calls: Routes = {
  ...namedSpacedCalls,
  ...otherCalls
};
