import { z } from "zod";
import {
  dockerContainerStart,
  dockerContainerStop,
  getVolumeSystemData,
  getVolumesOwnershipData,
  listPackage,
  listPackages,
  logContainer
} from "@dappnode/dockerapi";
import { Network, PortProtocol } from "@dappnode/types";
import type {
  Compose,
  DashboardSupportedNetwork,
  Manifest,
  PackageContainer,
  PortMapping,
  SetupWizard,
  StakerConfigSet,
  UserSettingsAllDnps
} from "@dappnode/types";
import { validateManifestSchema, validateDappnodeCompose, validateSetupWizardSchema } from "@dappnode/schemas";
import { yamlParse } from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import { getUserActionLogs } from "../calls/getUserActionLogs.js";
import { nodeStatusGetByNetwork } from "../calls/nodeStatusGet.js";
import { packageRemove } from "../calls/packageRemove.js";
import { packageRestart } from "../calls/packageRestart.js";
import { packageRestartVolumes } from "../calls/packageRestartVolumes.js";
import { packageSetEnvironment } from "../calls/packageSetEnvironment.js";
import { packageSetPortMappings } from "../calls/packageSetPortMappings.js";
import { portsApiStatusGet, portsUpnpStatusGet } from "../calls/portsStatusGet.js";
import { portsToOpenGet } from "../calls/portsToOpenGet.js";
import { MAX_UPLOAD_FILE_SIZE_BYTES, UPLOAD_TTL_MS } from "../uploads/tempTransfer.js";
import { statsCpuGet } from "../calls/statsCpuGet.js";
import { statsMemoryGet } from "../calls/statsMemoryGet.js";
import { statsDiskGet } from "../calls/statsDiskGet.js";
import { systemInfoGet } from "../calls/systemInfoGet.js";
import { diagnose } from "../calls/diagnose.js";
import { autoUpdateDataGet } from "../calls/autoUpdateDataGet.js";
import { notificationsGetAll } from "../calls/notifications.js";
import { volumeRemove } from "../calls/volumeRemove.js";
import { searchDocs, fetchDocPage } from "./docs.js";
import {
  abortMcpDevImageUpload,
  appendMcpDevImageUploadChunk,
  beginMcpDevImageUpload,
  finishMcpDevImageUpload,
  MCP_UPLOAD_CHUNK_BASE64_CHARS,
  MCP_UPLOAD_CHUNK_BYTES
} from "./upload.js";

// NOTE: packageInstall, fetchDnpRequest, fetchRegistry and stakerConfig are
// imported lazily (dynamic import inside the tool's execute()) because they
// statically import the dappmanager `../index.js` singletons. A static import
// here would create the load-time cycle
// index.ts → startHttpApi → routes/nexus → mcp/tools → calls → index.ts,
// which makes index.ts run its top-level `startHttpApi()` before nexus.ts
// finishes evaluating (TDZ: "Cannot access 'nexusStatus' before initialization").

/**
 * Shared tool registry consumed by both the MCP server (for external clients
 * like Claude Desktop / Cursor) and the chat proxy's in-process dispatcher.
 *
 * Each tool defines a Zod schema for input validation + JSON-Schema export,
 * plus an `execute()` that calls into existing dappmanager helpers. Tools
 * marked `mutating: true` mutate state — the system prompt instructs the
 * model to confirm with the user before invoking them.
 */
export interface DappnodeTool {
  /** OpenAI/MCP tool name (snake_case, prefixed with `dappnode_`). */
  name: string;
  /** Human-friendly label shown in the chat UI ("Restart package" vs the raw `dappnode_restart_package`). */
  displayName: string;
  /** Short description shown to the model. */
  description: string;
  /** True if the tool mutates state (restart, install, set_env, …). */
  mutating?: boolean;
  /** Zod raw shape — `{ key: z.string(), ... }`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, z.ZodType<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (input: any) => Promise<unknown>;
}

/** Standard MCP tool annotations derived from a tool's mutating flag. */
export function toolAnnotations(tool: DappnodeTool): {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
} {
  return {
    title: tool.displayName,
    readOnlyHint: !tool.mutating,
    destructiveHint: Boolean(tool.mutating)
  };
}

/* ────────────── Helpers ────────────── */

function compactContainer(c: PackageContainer): Record<string, unknown> {
  return {
    name: c.containerName,
    serviceName: c.serviceName,
    state: c.state,
    running: c.running,
    image: c.image,
    created: c.created
  };
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\n…(truncated)" : s;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const dashboardSupportedNetworks = [
  Network.Mainnet,
  Network.Gnosis,
  Network.Lukso,
  Network.Hoodi,
  Network.Sepolia
] as [Network.Mainnet, Network.Gnosis, Network.Lukso, Network.Hoodi, Network.Sepolia];

/* ────────────── Tools ────────────── */

const listPackagesTool: DappnodeTool = {
  name: "dappnode_list_packages",
  displayName: "List installed packages",
  description:
    "List every package installed on this DAppNode with its version, container state, and core/chain tags. Use this to know what's running.",
  schema: {},
  async execute() {
    const pkgs = await listPackages();
    return pkgs.map((p) => ({
      dnpName: p.dnpName,
      version: p.version,
      isCore: p.isCore,
      chain: p.chain ?? null,
      categories: p.categories ?? [],
      origin: p.origin ?? null,
      containers: (p.containers || []).map(compactContainer)
    }));
  }
};

const getPackageDetailsTool: DappnodeTool = {
  name: "dappnode_get_package_details",
  displayName: "Get package details",
  description:
    "Get full details for a specific package by its dnpName: containers, ports, volumes, env summary, dependencies.",
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName, e.g. 'mev-boost-hoodi.dnp.dappnode.eth'")
  },
  async execute({ dnpName }: { dnpName: string }) {
    const pkg = await listPackage({ dnpName });
    // Return as-is — listPackage already returns InstalledPackageData.
    return pkg;
  }
};

const getPackageLogsTool: DappnodeTool = {
  name: "dappnode_get_package_logs",
  displayName: "Read package logs",
  description: "Fetch the tail of container logs for a package. Returns one log block per container in the package.",
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName"),
    tail: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("Number of trailing lines per container. Default 100, max 500.")
  },
  async execute({ dnpName, tail = 100 }: { dnpName: string; tail?: number }) {
    const pkg = await listPackage({ dnpName });
    const out: Record<string, string> = {};
    for (const c of pkg.containers || []) {
      try {
        const raw = await logContainer(c.containerName, { tail, stdout: true, stderr: true });
        out[c.containerName] = truncate(raw, 40_000);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        out[c.containerName] = `(failed to fetch logs: ${message})`;
      }
    }
    return { dnpName, tail, containers: out };
  }
};

const getSystemInfoTool: DappnodeTool = {
  name: "dappnode_get_system_info",
  displayName: "Get system info",
  description: "Get system-level info for this DAppNode: CPU usage, memory, disk usage, hostname, IPs, version data.",
  schema: {},
  async execute() {
    const [cpu, memory, disk, system] = await Promise.allSettled([
      statsCpuGet(),
      statsMemoryGet(),
      statsDiskGet(),
      systemInfoGet()
    ]);
    return {
      cpu: cpu.status === "fulfilled" ? cpu.value : { error: String(cpu.reason) },
      memory: memory.status === "fulfilled" ? memory.value : { error: String(memory.reason) },
      disk: disk.status === "fulfilled" ? disk.value : { error: String(disk.reason) },
      system:
        system.status === "fulfilled"
          ? {
              name: system.value.name,
              dappnodeWebName: system.value.dappnodeWebName,
              internalIp: system.value.internalIp,
              publicIp: system.value.publicIp,
              staticIp: system.value.staticIp,
              domain: system.value.domain,
              versionData: system.value.versionData
            }
          : { error: String(system.reason) }
    };
  }
};

const restartPackageTool: DappnodeTool = {
  name: "dappnode_restart_package",
  displayName: "Restart package",
  description:
    "Restart a package's containers (re-creates them). Causes brief downtime for the package's services. Ask the user to confirm before calling this.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName to restart"),
    serviceNames: z
      .array(z.string())
      .optional()
      .describe("Optional list of service names to restart. If omitted, restarts all containers.")
  },
  async execute({ dnpName, serviceNames }: { dnpName: string; serviceNames?: string[] }) {
    logs.info(`MCP: dappnode_restart_package(${dnpName})`);
    await packageRestart({ dnpName, serviceNames });
    return {
      ok: true,
      dnpName,
      serviceNames: serviceNames ?? "all"
    };
  }
};

const removePackageTool: DappnodeTool = {
  name: "dappnode_remove_package",
  displayName: "Remove package",
  description:
    "Remove an installed package by dnpName. Set `deleteVolumes` only when the user explicitly wants to permanently delete the package's persistent data too. This stops and removes package containers and deletes package files; core packages cannot be removed. Ask the user to confirm before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName to remove."),
    deleteVolumes: z
      .boolean()
      .optional()
      .describe("If true, permanently delete the package's Docker volumes/persistent data. Default false.")
  },
  async execute({ dnpName, deleteVolumes = false }: { dnpName: string; deleteVolumes?: boolean }) {
    logs.info(`MCP: dappnode_remove_package(${dnpName}, deleteVolumes=${deleteVolumes})`);
    await packageRemove({ dnpName, deleteVolumes });
    return { ok: true, dnpName, deleteVolumes };
  }
};

const removePackageVolumeTool: DappnodeTool = {
  name: "dappnode_remove_package_volume",
  displayName: "Remove package volume",
  description:
    "Permanently delete one named volume for a package, or all package-owned named volumes if `volumeId` is omitted. This removes package data, removes affected containers, and re-ups the package. Use dappnode_get_package_details or dappnode_get_disk_usage first to identify the volume, and ask the user to confirm before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName whose volume data should be removed."),
    volumeId: z
      .string()
      .min(1)
      .optional()
      .describe("Docker volume name to remove. If omitted, removes all package-owned named volumes.")
  },
  async execute({ dnpName, volumeId }: { dnpName: string; volumeId?: string }) {
    logs.info(`MCP: dappnode_remove_package_volume(${dnpName}, ${volumeId ?? "all"})`);
    await packageRestartVolumes({ dnpName, volumeId });
    return { ok: true, dnpName, volumeId: volumeId ?? "all" };
  }
};

const listVolumesTool: DappnodeTool = {
  name: "dappnode_list_volumes",
  displayName: "List Docker volumes",
  description:
    "List Docker volumes known to DAppManager with owner package, internal compose volume name, size/refCount when available, orphan status, and custom mountpoint data. Use before deleting volume data so you can identify the exact volume name.",
  schema: {
    owner: z
      .string()
      .min(1)
      .optional()
      .describe("Optional package dnpName filter. Use 'unowned' to show volumes without an owner."),
    onlyOrphan: z.boolean().optional().describe("If true, return only orphan volumes. Default false.")
  },
  async execute({ owner, onlyOrphan = false }: { owner?: string; onlyOrphan?: boolean }) {
    const volumes = await getVolumeSystemData();
    const filtered = volumes.filter((volume) => {
      if (onlyOrphan && !volume.isOrphan) return false;
      if (!owner) return true;
      if (owner === "unowned") return !volume.owner;
      return volume.owner === owner;
    });

    return {
      count: filtered.length,
      volumes: filtered
    };
  }
};

const removeOrphanVolumeTool: DappnodeTool = {
  name: "dappnode_remove_orphan_volume",
  displayName: "Remove orphan volume",
  description:
    "Permanently delete an orphan/unowned Docker volume by exact volume name. This refuses package-owned or currently referenced volumes; use dappnode_list_volumes first and ask the user to confirm before calling.",
  mutating: true,
  schema: {
    name: z.string().min(1).describe("Exact Docker volume name to remove.")
  },
  async execute({ name }: { name: string }) {
    const volume = (await getVolumeSystemData()).find((vol) => vol.name === name);
    if (!volume) throw Error(`Volume not found: ${name}`);
    if (!volume.isOrphan) {
      throw Error(
        `Refusing to remove non-orphan volume ${name}${volume.owner ? ` owned by ${volume.owner}` : ""}. Use dappnode_remove_package_volume for package-owned volumes.`
      );
    }

    logs.info(`MCP: dappnode_remove_orphan_volume(${name})`);
    await volumeRemove({ name });
    return { ok: true, name };
  }
};

const startPackageTool: DappnodeTool = {
  name: "dappnode_start_package",
  displayName: "Start package",
  description:
    "Start every container of a package by dnpName. Use when a package is exited and the user wants it running. Ask the user to confirm before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName to start")
  },
  async execute({ dnpName }: { dnpName: string }) {
    logs.info(`MCP: dappnode_start_package(${dnpName})`);
    const pkg = await listPackage({ dnpName });
    const results: { container: string; ok: boolean; error?: string }[] = [];
    for (const c of pkg.containers || []) {
      try {
        await dockerContainerStart(c.containerName);
        results.push({ container: c.containerName, ok: true });
      } catch (err) {
        results.push({
          container: c.containerName,
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return { dnpName, results };
  }
};

const stopPackageTool: DappnodeTool = {
  name: "dappnode_stop_package",
  displayName: "Stop package",
  description:
    "Stop every container of a package by dnpName. The package's services will become unavailable until started again. Ask the user to confirm before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName to stop")
  },
  async execute({ dnpName }: { dnpName: string }) {
    logs.info(`MCP: dappnode_stop_package(${dnpName})`);
    const pkg = await listPackage({ dnpName });
    const results: { container: string; ok: boolean; error?: string }[] = [];
    for (const c of pkg.containers || []) {
      try {
        await dockerContainerStop(c.containerName);
        results.push({ container: c.containerName, ok: true });
      } catch (err) {
        results.push({
          container: c.containerName,
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return { dnpName, results };
  }
};

const updatePackageTool: DappnodeTool = {
  name: "dappnode_update_package",
  displayName: "Update package",
  description:
    "Update a package to a specific version, or to its latest version if `version` is omitted. Re-runs the install flow — may cause brief downtime. Ask the user to confirm, including the version, before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName to update"),
    version: z.string().optional().describe("Optional target version (semver or IPFS hash). Defaults to latest.")
  },
  async execute({ dnpName, version }: { dnpName: string; version?: string }) {
    logs.info(`MCP: dappnode_update_package(${dnpName}, ${version ?? "latest"})`);
    const { packageInstall } = await import("../calls/packageInstall.js");
    await packageInstall({
      name: dnpName,
      version,
      userSettings: {},
      notificationsSettings: {},
      options: {}
    });
    return { ok: true, dnpName, version: version ?? "latest" };
  }
};

const diagnoseTool: DappnodeTool = {
  name: "dappnode_diagnose",
  displayName: "Run system diagnostic",
  description:
    "Run a system-level diagnostic of the DAppNode host (network, services, docker, disk, memory). Use proactively if the user reports anything wrong.",
  schema: {},
  async execute() {
    return await diagnose();
  }
};

const listNotificationsTool: DappnodeTool = {
  name: "dappnode_list_notifications",
  displayName: "List notifications",
  description:
    "Get recent notifications from the DAppNode notifier — health alerts, update prompts, validator events. Returns the newest first.",
  schema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Maximum number of notifications to return. Default 25, max 200.")
  },
  async execute({ limit = 25 }: { limit?: number }) {
    const all = await notificationsGetAll();
    // Sort newest first (timestamp is usually epoch).
    const sorted = [...all].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    return sorted.slice(0, limit);
  }
};

const getAvailableUpdatesTool: DappnodeTool = {
  name: "dappnode_get_available_updates",
  displayName: "Check for updates",
  description:
    "List packages that have updates available, plus current auto-update settings and the auto-update registry of past runs.",
  schema: {},
  async execute() {
    return await autoUpdateDataGet();
  }
};

const getDiskUsageTool: DappnodeTool = {
  name: "dappnode_get_disk_usage",
  displayName: "Check disk usage",
  description:
    "Disk usage grouped by docker volume (and by owning package). Answers questions like 'what's eating my disk'. Returns sizes in bytes.",
  schema: {},
  async execute() {
    const [ownership, systemData] = await Promise.all([getVolumesOwnershipData(), getVolumeSystemData()]);
    // Aggregate volume sizes by owner dnpName for the model's convenience.
    const byOwner: Record<string, { totalBytes: number; volumes: { name: string; size?: number | string }[] }> = {};
    for (const o of ownership) {
      const sys = systemData.find((s) => s.name === o.name);
      const sizeNum = typeof sys?.size === "number" ? sys.size : 0;
      const owner = o.owner || "unowned";
      if (!byOwner[owner]) byOwner[owner] = { totalBytes: 0, volumes: [] };
      byOwner[owner].totalBytes += sizeNum;
      byOwner[owner].volumes.push({ name: o.name, size: sys?.size });
    }
    return {
      grouped: byOwner,
      total: Object.values(byOwner).reduce((acc, b) => acc + b.totalBytes, 0)
    };
  }
};

const getPortsStatusTool: DappnodeTool = {
  name: "dappnode_get_ports_status",
  displayName: "Check ports status",
  description:
    "Return ports that packages need exposed, plus optional UPnP mapping status and optional external TCP scan status. Use for networking/port-forwarding troubleshooting.",
  schema: {
    checkUpnp: z.boolean().optional().describe("If true, compare required ports with current UPnP mappings. Default true."),
    checkApi: z
      .boolean()
      .optional()
      .describe("If true, run the external port scanner service for TCP ports. Default true.")
  },
  async execute({ checkUpnp = true, checkApi = true }: { checkUpnp?: boolean; checkApi?: boolean }) {
    const portsToOpen = await portsToOpenGet();
    const errors: Record<string, string> = {};
    let upnpStatus: unknown;
    let apiStatus: unknown;

    if (portsToOpen.length > 0 && checkUpnp) {
      try {
        upnpStatus = await portsUpnpStatusGet({ portsToOpen });
      } catch (err) {
        errors.upnp = errMessage(err);
      }
    }

    if (portsToOpen.length > 0 && checkApi) {
      try {
        apiStatus = await portsApiStatusGet({ portsToOpen });
      } catch (err) {
        errors.api = errMessage(err);
      }
    }

    return {
      portsToOpen,
      upnpStatus: upnpStatus ?? null,
      apiStatus: apiStatus ?? null,
      errors
    };
  }
};

const getUserActionLogsTool: DappnodeTool = {
  name: "dappnode_get_user_action_logs",
  displayName: "Read user action logs",
  description:
    "Read recent DAppManager user action logs, newest first. Useful for support questions like 'what changed recently?' or failed package operations.",
  schema: {
    first: z.number().int().min(1).max(200).optional().describe("Number of log entries to return. Default 50, max 200."),
    after: z.number().int().min(0).optional().describe("Pagination offset, where 0 is the newest log. Default 0.")
  },
  async execute({ first = 50, after = 0 }: { first?: number; after?: number }) {
    return await getUserActionLogs({ first, after });
  }
};

const getNodeStatusTool: DappnodeTool = {
  name: "dappnode_get_node_status",
  displayName: "Check node status",
  description:
    "Check execution and consensus client status for staking dashboard networks: client name, sync status/progress, current block/slot, peers, or RPC errors. If `networks` is omitted, checks every supported dashboard network.",
  schema: {
    networks: z
      .array(z.enum(dashboardSupportedNetworks))
      .optional()
      .describe("Networks to check. Defaults to mainnet, gnosis, lukso, hoodi, and sepolia.")
  },
  async execute({ networks = dashboardSupportedNetworks }: { networks?: DashboardSupportedNetwork[] }) {
    return await nodeStatusGetByNetwork({ networks });
  }
};

/* ────────────── Docs tools (official docs.dappnode.io as source of truth) ────────────── */

const searchDocsTool: DappnodeTool = {
  name: "dappnode_search_docs",
  displayName: "Search DAppNode docs",
  description:
    "Search the official DAppNode docs at docs.dappnode.io. Use this for ANY question about DAppNode concepts, packages, configuration, troubleshooting, staking, networking, or how-to. The docs are the source of truth — prefer them over training-data memory. Returns ranked matches with title, URL, and a snippet around the matched text. After reading the snippet, call dappnode_fetch_doc on the URL if you need the full page.",
  schema: {
    query: z
      .string()
      .min(2)
      .describe(
        "Free-text keywords. Use specific terms — e.g. 'mev-boost configuration', 'wireguard setup', 'tailscale access', 'smooth subscription'."
      ),
    limit: z.number().int().min(1).max(10).optional().describe("Max number of results. Default 5.")
  },
  async execute({ query, limit }: { query: string; limit?: number }) {
    return await searchDocs(query, limit ?? 5);
  }
};

const fetchDocTool: DappnodeTool = {
  name: "dappnode_fetch_doc",
  displayName: "Read DAppNode doc page",
  description:
    "Fetch the full markdown of a single DAppNode docs page by its docs.dappnode.io URL. Use this AFTER dappnode_search_docs when a snippet isn't enough and you need the whole page (e.g. step-by-step instructions, full reference tables).",
  schema: {
    url: z
      .string()
      .url()
      .describe(
        "Full https://docs.dappnode.io/... URL of the doc page (typically obtained from dappnode_search_docs or from the index in the system prompt)."
      )
  },
  async execute({ url }: { url: string }) {
    const page = await fetchDocPage(url);
    if (!page) {
      return { error: "Page not found, fetch failed, or URL is not under docs.dappnode.io" };
    }
    return page;
  }
};

/* ────────────── Staker config tools ────────────── */

const getStakerConfigTool: DappnodeTool = {
  name: "dappnode_get_staker_config",
  displayName: "Get staker config",
  description:
    "Read the current staker configuration for a network: which execution client, consensus client, mev-boost and web3signer are selected, plus the full list of available options per slot. Use this before suggesting changes so you know the starting state.",
  schema: {
    network: z
      .nativeEnum(Network)
      .describe(
        "Staker network: 'mainnet', 'gnosis', 'lukso', 'hoodi', 'holesky', 'sepolia', 'prater', 'starknet', 'starknet-sepolia'."
      )
  },
  async execute({ network }: { network: Network }) {
    const { stakerConfigGet } = await import("../calls/stakerConfig.js");
    return await stakerConfigGet({ network });
  }
};

const setStakerConfigTool: DappnodeTool = {
  name: "dappnode_set_staker_config",
  displayName: "Change staker config",
  description:
    "Change the staker setup on a network: pick (or clear) the execution/consensus/mev-boost/web3signer clients, and update the mev-boost relay list. Call dappnode_get_staker_config first and pass the full intended configuration; use null only when you explicitly want to unset a slot. This touches multiple packages — ask the user to confirm before calling.",
  mutating: true,
  schema: {
    network: z.nativeEnum(Network).describe("Staker network to configure."),
    executionDnpName: z
      .string()
      .nullable()
      .describe(
        "Execution client dnpName, or null to unset. Required to avoid accidental partial staker changes."
      ),
    consensusDnpName: z.string().nullable().describe("Consensus client dnpName, or null to unset."),
    mevBoostDnpName: z.string().nullable().describe("MEV-boost dnpName, or null to unset."),
    web3signerDnpName: z.string().nullable().describe("Web3signer dnpName, or null to unset."),
    relays: z.array(z.string()).describe("Full list of MEV-boost relay URLs; pass [] only to clear the list.")
  },
  async execute({
    network,
    executionDnpName,
    consensusDnpName,
    mevBoostDnpName,
    web3signerDnpName,
    relays
  }: {
    network: Network;
    executionDnpName: string | null;
    consensusDnpName: string | null;
    mevBoostDnpName: string | null;
    web3signerDnpName: string | null;
    relays: string[];
  }) {
    logs.info(`MCP: dappnode_set_staker_config(${network})`);
    const stakerConfig: StakerConfigSet = {
      network,
      executionDnpName,
      consensusDnpName,
      mevBoostDnpName,
      web3signerDnpName,
      relays
    };
    const { stakerConfigSet } = await import("../calls/stakerConfig.js");
    await stakerConfigSet({ stakerConfig });
    return { ok: true, network, applied: stakerConfig };
  }
};

/* ────────────── Package env / port tools ────────────── */

const setPackageEnvironmentTool: DappnodeTool = {
  name: "dappnode_set_package_environment",
  displayName: "Edit package env vars",
  description:
    "Edit environment variables of a package, per service. The package will be re-upped (brief downtime) so the new env applies. Pass `environmentByService` as `{ serviceName: { KEY: 'value', ... } }`. Use dappnode_get_package_details first to inspect the current env. Ask the user to confirm before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName whose env to edit"),
    environmentByService: z
      .record(z.record(z.string()))
      .describe("Map of serviceName → { envKey: envValue }. Existing keys are merged.")
  },
  async execute({
    dnpName,
    environmentByService
  }: {
    dnpName: string;
    environmentByService: Record<string, Record<string, string>>;
  }) {
    logs.info(`MCP: dappnode_set_package_environment(${dnpName})`);
    await packageSetEnvironment({ dnpName, environmentByService });
    return { ok: true, dnpName, environmentByService };
  }
};

const setPackagePortMappingsTool: DappnodeTool = {
  name: "dappnode_set_package_port_mappings",
  displayName: "Edit package port mappings",
  description:
    "Edit host-port mappings of a package, per service. The package will be re-upped (brief downtime). Auto-rolls-back if the new host port is already in use. Pass `portMappingsByService` as `{ serviceName: [{ host?: number, container: number, protocol: 'TCP'|'UDP' }, ...] }`. Set `merge: true` to add to existing mappings; otherwise the list is replaced. Ask the user to confirm before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName whose ports to edit"),
    portMappingsByService: z
      .record(
        z.array(
          z.object({
            host: z.number().int().min(1).max(65535).optional(),
            container: z.number().int().min(1).max(65535),
            protocol: z.nativeEnum(PortProtocol)
          })
        )
      )
      .describe("Map of serviceName → array of port mappings."),
    merge: z
      .boolean()
      .optional()
      .describe("If true, merge with existing mappings instead of replacing them. Default false.")
  },
  async execute({
    dnpName,
    portMappingsByService,
    merge = false
  }: {
    dnpName: string;
    portMappingsByService: Record<string, PortMapping[]>;
    merge?: boolean;
  }) {
    logs.info(`MCP: dappnode_set_package_port_mappings(${dnpName}, merge=${merge})`);
    await packageSetPortMappings({ dnpName, portMappingsByService, options: { merge } });
    return { ok: true, dnpName, portMappingsByService, merge };
  }
};

/* ────────────── Package development tools ────────────── */

const validatePackageTool: DappnodeTool = {
  name: "dappnode_validate_package",
  displayName: "Validate package files",
  description:
    "Validate a DAppNode package you are DEVELOPING, fast and offline, WITHOUT building an IPFS hash. Pass the raw contents of dappnode_package.json (manifest) and docker-compose.yml, plus optionally setup-wizard.yml. Runs the exact manifest + DAppNode-compose + setup-wizard schema checks the dappmanager applies at install time, and returns the list of problems to fix. Call this on every iteration while authoring a package. NOTE: it does NOT run `docker compose config` (the Docker-level structural check) — run that yourself locally, together with `docker compose build/up` and reading container logs, to verify the package actually runs.",
  schema: {
    manifest: z
      .union([z.string(), z.record(z.any())])
      .describe("Contents of dappnode_package.json — either the raw JSON string or the already-parsed object."),
    compose: z.string().min(1).describe("Raw contents of docker-compose.yml (YAML)."),
    setupWizard: z
      .union([z.string(), z.record(z.any())])
      .optional()
      .describe("Optional contents of setup-wizard.yml / setup-wizard.json (YAML or JSON).")
  },
  async execute({
    manifest,
    compose,
    setupWizard
  }: {
    manifest: string | Record<string, unknown>;
    compose: string;
    setupWizard?: string | Record<string, unknown>;
  }) {
    const errors: string[] = [];

    let manifestObj: Manifest | undefined;
    try {
      manifestObj = (typeof manifest === "string" ? JSON.parse(manifest) : manifest) as Manifest;
    } catch (err) {
      return { ok: false, errors: [`dappnode_package.json is not valid JSON: ${errMessage(err)}`] };
    }

    try {
      validateManifestSchema(manifestObj);
    } catch (err) {
      errors.push(errMessage(err));
    }

    let composeObj: Compose | undefined;
    try {
      composeObj = yamlParse<Compose>(compose);
    } catch (err) {
      errors.push(`docker-compose.yml is not valid YAML: ${errMessage(err)}`);
    }

    if (composeObj && manifestObj) {
      try {
        validateDappnodeCompose(composeObj, manifestObj);
      } catch (err) {
        errors.push(errMessage(err));
      }
    }

    if (setupWizard !== undefined) {
      let setupWizardObj: SetupWizard | undefined;
      try {
        setupWizardObj = (typeof setupWizard === "string" ? yamlParse(setupWizard) : setupWizard) as SetupWizard;
      } catch (err) {
        errors.push(`setup-wizard is not valid YAML/JSON: ${errMessage(err)}`);
      }
      if (setupWizardObj) {
        try {
          validateSetupWizardSchema(setupWizardObj);
        } catch (err) {
          errors.push(errMessage(err));
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      checked: { manifest: true, compose: Boolean(composeObj), setupWizard: setupWizard !== undefined }
    };
  }
};

const getDevUploadInfoTool: DappnodeTool = {
  name: "dappnode_get_dev_upload_info",
  displayName: "Get custom package upload info",
  description:
    "Return the supported ways to stage a `docker save` image tarball before calling `dappnode_install_dev_package`. MCP clients should prefer the chunked MCP upload tools when they cannot reach this DAppNode's `/upload` endpoint directly.",
  schema: {},
  async execute() {
    return {
      mcpChunkedUpload: {
        tools: [
          "dappnode_begin_dev_image_upload",
          "dappnode_append_dev_image_upload_chunk",
          "dappnode_finish_dev_image_upload",
          "dappnode_abort_dev_image_upload"
        ],
        maxFileSizeBytes: MAX_UPLOAD_FILE_SIZE_BYTES,
        maxChunkBytes: MCP_UPLOAD_CHUNK_BYTES,
        maxChunkBase64Chars: MCP_UPLOAD_CHUNK_BASE64_CHARS,
        ttlMs: UPLOAD_TTL_MS,
        finishResponse: "JSON object with imageFileId, sizeBytes, sha256, and expiresInMs",
        note: "Use this path when the MCP client can call POST /mcp but cannot make a separate authenticated multipart request to /upload. Chunks must be standard padded base64 and appended in order using the returned uploadId and byte offset. Finish returns imageFileId."
      },
      httpUpload: {
        uploadPath: "/upload",
        formFieldName: "file",
        method: "POST",
        maxFileSizeBytes: MAX_UPLOAD_FILE_SIZE_BYTES,
        maxFiles: 10,
        auth: "Admin browser session cookie only. The generated MCP API key is scoped to POST /mcp and is not accepted by /upload.",
        responseType: "plain text fileId"
      },
      note: "After staging the image by either method, pass the returned fileId/imageFileId to dappnode_install_dev_package. Uploaded files expire after 15 minutes. External MCP exposes mutating tools such as uploads and dappnode_install_dev_package only when the admin enables mutating MCP tools in System > Advanced; embedded Nexus chat uses its own confirmation flow."
    };
  }
};

const beginDevImageUploadTool: DappnodeTool = {
  name: "dappnode_begin_dev_image_upload",
  displayName: "Begin custom image upload",
  description:
    "Start an MCP-native chunked upload for a `docker save` image tarball. Use this when the MCP client can call POST /mcp but cannot access the DAppNode `/upload` endpoint directly. Pass the total byte size, and optionally a sha256 hex digest. Then call dappnode_append_dev_image_upload_chunk repeatedly with standard padded base64 chunks, and finally dappnode_finish_dev_image_upload to receive imageFileId. This writes a temporary file and requires explicit user approval.",
  mutating: true,
  schema: {
    sizeBytes: z
      .number()
      .int()
      .min(1)
      .max(MAX_UPLOAD_FILE_SIZE_BYTES)
      .describe("Total byte size of the docker save tarball."),
    sha256: z.string().length(64).optional().describe("Optional expected SHA-256 hex digest of the complete tarball."),
    fileName: z.string().max(255).optional().describe("Optional local filename for operator-facing context.")
  },
  async execute({ sizeBytes, sha256, fileName }: { sizeBytes: number; sha256?: string; fileName?: string }) {
    logs.info(`MCP: dappnode_begin_dev_image_upload(${fileName ?? "image.tar"}, ${sizeBytes} bytes)`);
    return await beginMcpDevImageUpload({ sizeBytes, sha256, fileName });
  }
};

const appendDevImageUploadChunkTool: DappnodeTool = {
  name: "dappnode_append_dev_image_upload_chunk",
  displayName: "Append custom image upload chunk",
  description:
    "Append one standard padded base64 chunk to an MCP-native dev image upload. Chunks must be sent in order. The `offset` is the number of raw bytes already accepted, returned by the previous append call. Each raw decoded chunk must be at most 1 MiB. This writes temporary file data and requires explicit user approval.",
  mutating: true,
  schema: {
    uploadId: z.string().min(1).describe("uploadId returned by dappnode_begin_dev_image_upload."),
    offset: z.number().int().min(0).describe("Raw byte offset for this chunk. Must equal receivedBytes so far."),
    chunkBase64: z
      .string()
      .min(1)
      .max(MCP_UPLOAD_CHUNK_BASE64_CHARS)
      .describe("Standard padded base64 for the next raw chunk, max decoded size 1 MiB.")
  },
  async execute({ uploadId, offset, chunkBase64 }: { uploadId: string; offset: number; chunkBase64: string }) {
    return await appendMcpDevImageUploadChunk({ uploadId, offset, chunkBase64 });
  }
};

const finishDevImageUploadTool: DappnodeTool = {
  name: "dappnode_finish_dev_image_upload",
  displayName: "Finish custom image upload",
  description:
    "Finish an MCP-native dev image upload after every chunk has been appended. Verifies the declared size and optional sha256 digest, registers the staged tarball in DAppManager's temporary file-transfer store, and returns `imageFileId` for dappnode_install_dev_package. This requires explicit user approval.",
  mutating: true,
  schema: {
    uploadId: z.string().min(1).describe("uploadId returned by dappnode_begin_dev_image_upload.")
  },
  async execute({ uploadId }: { uploadId: string }) {
    logs.info(`MCP: dappnode_finish_dev_image_upload(${uploadId})`);
    return await finishMcpDevImageUpload(uploadId);
  }
};

const abortDevImageUploadTool: DappnodeTool = {
  name: "dappnode_abort_dev_image_upload",
  displayName: "Abort custom image upload",
  description:
    "Abort an in-progress MCP-native dev image upload and delete its temporary partial file. Use this if the upload fails or the user cancels.",
  mutating: true,
  schema: {
    uploadId: z.string().min(1).describe("uploadId returned by dappnode_begin_dev_image_upload.")
  },
  async execute({ uploadId }: { uploadId: string }) {
    return await abortMcpDevImageUpload(uploadId);
  }
};

const installDevPackageTool: DappnodeTool = {
  name: "dappnode_install_dev_package",
  displayName: "Install custom package",
  description:
    "Install a package you are DEVELOPING into this DAppNode WITHOUT IPFS, so you can test it end-to-end. It is listed under the 'My custom packages' tab (separate from registry packages). Provide the raw dappnode_package.json (manifest) and docker-compose.yml contents, plus `imageFileId`: the fileId returned by `/upload` or the imageFileId returned by dappnode_finish_dev_image_upload. The image inside the tarball MUST be tagged exactly `<service>.<dnpName>:<version>` — build it first with `docker compose build`, then `docker save <image> -o <tar>`, stage the tarball, and pass the returned imageFileId here. Always run dappnode_validate_package first. This mutates state and starts containers — confirm with the user before calling. To re-install an updated build, run it again with the same name.",
  mutating: true,
  schema: {
    manifest: z
      .union([z.string(), z.record(z.any())])
      .describe("Contents of dappnode_package.json — either the raw JSON string or the already-parsed object."),
    compose: z.string().min(1).describe("Raw contents of docker-compose.yml (YAML)."),
    imageFileId: z
      .string()
      .min(1)
      .describe(
        "File ID for the staged `docker save` image tarball. Use the `/upload` endpoint with an admin session cookie, or use the MCP chunked upload tools and pass the imageFileId returned by dappnode_finish_dev_image_upload."
      ),
    setupWizard: z
      .union([z.string(), z.record(z.any())])
      .optional()
      .describe("Optional contents of setup-wizard.yml / setup-wizard.json (YAML or JSON).")
  },
  async execute({
    manifest,
    compose,
    imageFileId,
    setupWizard
  }: {
    manifest: string | Record<string, unknown>;
    compose: string;
    imageFileId: string;
    setupWizard?: string | Record<string, unknown>;
  }) {
    const manifestObj = (typeof manifest === "string" ? JSON.parse(manifest) : manifest) as Manifest;
    const setupWizardStr =
      setupWizard === undefined
        ? undefined
        : typeof setupWizard === "string"
          ? setupWizard
          : JSON.stringify(setupWizard);

    logs.info(`MCP: dappnode_install_dev_package(${manifestObj.name})`);
    const { packageInstallDev } = await import("../calls/packageInstallDev.js");
    await packageInstallDev({ manifest: manifestObj, compose, imageFileId, setupWizard: setupWizardStr });
    return { ok: true, dnpName: manifestObj.name, version: manifestObj.version };
  }
};

/* ────────────── Registry / install tools ────────────── */

const searchRegistryTool: DappnodeTool = {
  name: "dappnode_search_registry",
  displayName: "Browse package registry",
  description:
    "Browse the DAppNode public package registry. Returns packages with their name, description, categories and install status. NOTE: this scans the chain — slower than the other read tools, so call sparingly (e.g. once when the user asks 'what's available' or 'what can I install for X'). Optional `query` filters by case-insensitive substring on name and description.",
  schema: {
    query: z.string().optional().describe("Optional case-insensitive substring filter on name/description."),
    limit: z.number().int().min(1).max(100).optional().describe("Max entries to return. Default 25, max 100.")
  },
  async execute({ query, limit = 25 }: { query?: string; limit?: number }) {
    const { fetchRegistry } = await import("../calls/fetchRegistry.js");
    const entries = await fetchRegistry();
    const needle = query?.trim().toLowerCase();
    const filtered = needle
      ? entries.filter((e) => {
          const name = e.name?.toLowerCase() ?? "";
          const description = e.status === "ok" ? (e.description?.toLowerCase() ?? "") : "";
          return name.includes(needle) || description.includes(needle);
        })
      : entries;
    return filtered.slice(0, limit).map((e) => ({
      name: e.name,
      status: e.status,
      description: e.status === "ok" ? e.description : undefined,
      categories: e.status === "ok" ? e.categories : undefined,
      isInstalled: e.status === "ok" ? e.isInstalled : undefined,
      isUpdated: e.status === "ok" ? e.isUpdated : undefined,
      error: e.status === "error" ? e.message : undefined
    }));
  }
};

const fetchInstallPreviewTool: DappnodeTool = {
  name: "dappnode_fetch_install_preview",
  displayName: "Preview package install",
  description:
    "Fetch the install preview of a package: special permissions it needs, its dependency tree, signature status, compatibility checks and the setup-wizard fields the user would fill in. ALWAYS call this BEFORE dappnode_install_package so you can present the permissions and required setup to the user.",
  schema: {
    name: z.string().min(1).describe("Package dnpName, e.g. 'bitcoin.dnp.dappnode.eth'"),
    version: z.string().optional().describe("Optional target version (semver or IPFS hash). Defaults to latest.")
  },
  async execute({ name, version }: { name: string; version?: string }) {
    const { fetchDnpRequest } = await import("../calls/fetchDnpRequest.js");
    return await fetchDnpRequest({ id: name, version });
  }
};

const installPackageTool: DappnodeTool = {
  name: "dappnode_install_package",
  displayName: "Install package",
  description:
    "Install a new package, resolving dependencies and starting its containers. ALWAYS call dappnode_fetch_install_preview first and present the special permissions + dependency list + version to the user. Only call this AFTER explicit user confirmation. `userSettings` shape is per-package (driven by the setup wizard from the preview) — pass it as the same nested object the UI would build.",
  mutating: true,
  schema: {
    name: z.string().min(1).describe("Package dnpName to install"),
    version: z.string().optional().describe("Optional target version (semver or IPFS hash). Defaults to latest."),
    userSettings: z
      .record(z.any())
      .optional()
      .describe(
        "Per-package settings (env vars, port mappings, named-volume mountpoints, …). Structure matches the setup wizard returned by dappnode_fetch_install_preview."
      ),
    options: z
      .object({
        BYPASS_RESOLVER: z.boolean().optional(),
        BYPASS_CORE_RESTRICTION: z.boolean().optional()
      })
      .optional()
      .describe("Advanced install flags. Omit unless the user explicitly asked for them.")
  },
  async execute({
    name,
    version,
    userSettings,
    options
  }: {
    name: string;
    version?: string;
    userSettings?: UserSettingsAllDnps;
    options?: { BYPASS_RESOLVER?: boolean; BYPASS_CORE_RESTRICTION?: boolean };
  }) {
    logs.info(`MCP: dappnode_install_package(${name}, ${version ?? "latest"})`);
    const { packageInstall } = await import("../calls/packageInstall.js");
    await packageInstall({
      name,
      version,
      userSettings: userSettings ?? {},
      notificationsSettings: {},
      options: options ?? {}
    });
    return { ok: true, name, version: version ?? "latest" };
  }
};

export const dappnodeTools: Record<string, DappnodeTool> = {
  [searchDocsTool.name]: searchDocsTool,
  [fetchDocTool.name]: fetchDocTool,
  [listPackagesTool.name]: listPackagesTool,
  [getPackageDetailsTool.name]: getPackageDetailsTool,
  [getPackageLogsTool.name]: getPackageLogsTool,
  [listVolumesTool.name]: listVolumesTool,
  [getSystemInfoTool.name]: getSystemInfoTool,
  [getDiskUsageTool.name]: getDiskUsageTool,
  [getPortsStatusTool.name]: getPortsStatusTool,
  [getUserActionLogsTool.name]: getUserActionLogsTool,
  [getNodeStatusTool.name]: getNodeStatusTool,
  [getAvailableUpdatesTool.name]: getAvailableUpdatesTool,
  [listNotificationsTool.name]: listNotificationsTool,
  [diagnoseTool.name]: diagnoseTool,
  [startPackageTool.name]: startPackageTool,
  [stopPackageTool.name]: stopPackageTool,
  [restartPackageTool.name]: restartPackageTool,
  [removePackageTool.name]: removePackageTool,
  [removePackageVolumeTool.name]: removePackageVolumeTool,
  [removeOrphanVolumeTool.name]: removeOrphanVolumeTool,
  [updatePackageTool.name]: updatePackageTool,
  [getStakerConfigTool.name]: getStakerConfigTool,
  [setStakerConfigTool.name]: setStakerConfigTool,
  [setPackageEnvironmentTool.name]: setPackageEnvironmentTool,
  [setPackagePortMappingsTool.name]: setPackagePortMappingsTool,
  [validatePackageTool.name]: validatePackageTool,
  [getDevUploadInfoTool.name]: getDevUploadInfoTool,
  [beginDevImageUploadTool.name]: beginDevImageUploadTool,
  [appendDevImageUploadChunkTool.name]: appendDevImageUploadChunkTool,
  [finishDevImageUploadTool.name]: finishDevImageUploadTool,
  [abortDevImageUploadTool.name]: abortDevImageUploadTool,
  [installDevPackageTool.name]: installDevPackageTool,
  [searchRegistryTool.name]: searchRegistryTool,
  [fetchInstallPreviewTool.name]: fetchInstallPreviewTool,
  [installPackageTool.name]: installPackageTool
};

export const dappnodeToolList: DappnodeTool[] = Object.values(dappnodeTools);
