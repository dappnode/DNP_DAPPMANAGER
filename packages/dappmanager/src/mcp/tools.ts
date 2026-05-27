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
import type { PackageContainer } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { packageRestart } from "../calls/packageRestart.js";
import { packageInstall } from "../calls/packageInstall.js";
import { statsCpuGet } from "../calls/statsCpuGet.js";
import { statsMemoryGet } from "../calls/statsMemoryGet.js";
import { statsDiskGet } from "../calls/statsDiskGet.js";
import { systemInfoGet } from "../calls/systemInfoGet.js";
import { diagnose } from "../calls/diagnose.js";
import { autoUpdateDataGet } from "../calls/autoUpdateDataGet.js";
import { notificationsGetAll } from "../calls/notifications.js";
import { searchDocs, fetchDocPage } from "./docs.js";

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

/* ────────────── Tools ────────────── */

const listPackagesTool: DappnodeTool = {
  name: "dappnode_list_packages",
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
  description:
    "Get full details for a specific package by its dnpName: containers, ports, volumes, env summary, dependencies.",
  schema: {
    dnpName: z
      .string()
      .min(1)
      .describe("The package dnpName, e.g. 'mev-boost-hoodi.dnp.dappnode.eth'")
  },
  async execute({ dnpName }: { dnpName: string }) {
    const pkg = await listPackage({ dnpName });
    // Return as-is — listPackage already returns InstalledPackageData.
    return pkg;
  }
};

const getPackageLogsTool: DappnodeTool = {
  name: "dappnode_get_package_logs",
  description:
    "Fetch the tail of container logs for a package. Returns one log block per container in the package.",
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
  description:
    "Get system-level info for this DAppNode: CPU usage, memory, disk usage, hostname, IPs, version data.",
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

const startPackageTool: DappnodeTool = {
  name: "dappnode_start_package",
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
  description:
    "Update a package to a specific version, or to its latest version if `version` is omitted. Re-runs the install flow — may cause brief downtime. Ask the user to confirm, including the version, before calling.",
  mutating: true,
  schema: {
    dnpName: z.string().min(1).describe("The package dnpName to update"),
    version: z
      .string()
      .optional()
      .describe("Optional target version (semver or IPFS hash). Defaults to latest.")
  },
  async execute({ dnpName, version }: { dnpName: string; version?: string }) {
    logs.info(`MCP: dappnode_update_package(${dnpName}, ${version ?? "latest"})`);
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
  description:
    "Run a system-level diagnostic of the DAppNode host (network, services, docker, disk, memory). Use proactively if the user reports anything wrong.",
  schema: {},
  async execute() {
    return await diagnose();
  }
};

const listNotificationsTool: DappnodeTool = {
  name: "dappnode_list_notifications",
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
  description:
    "List packages that have updates available, plus current auto-update settings and the auto-update registry of past runs.",
  schema: {},
  async execute() {
    return await autoUpdateDataGet();
  }
};

const getDiskUsageTool: DappnodeTool = {
  name: "dappnode_get_disk_usage",
  description:
    "Disk usage grouped by docker volume (and by owning package). Answers questions like 'what's eating my disk'. Returns sizes in bytes.",
  schema: {},
  async execute() {
    const [ownership, systemData] = await Promise.all([
      getVolumesOwnershipData(),
      getVolumeSystemData()
    ]);
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

/* ────────────── Docs tools (official docs.dappnode.io as source of truth) ────────────── */

const searchDocsTool: DappnodeTool = {
  name: "dappnode_search_docs",
  description:
    "Search the official DAppNode docs at docs.dappnode.io. Use this for ANY question about DAppNode concepts, packages, configuration, troubleshooting, staking, networking, or how-to. The docs are the source of truth — prefer them over training-data memory. Returns ranked matches with title, URL, and a snippet around the matched text. After reading the snippet, call dappnode_fetch_doc on the URL if you need the full page.",
  schema: {
    query: z
      .string()
      .min(2)
      .describe(
        "Free-text keywords. Use specific terms — e.g. 'mev-boost configuration', 'wireguard setup', 'tailscale access', 'smooth subscription'."
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("Max number of results. Default 5.")
  },
  async execute({ query, limit }: { query: string; limit?: number }) {
    return await searchDocs(query, limit ?? 5);
  }
};

const fetchDocTool: DappnodeTool = {
  name: "dappnode_fetch_doc",
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

export const dappnodeTools: Record<string, DappnodeTool> = {
  [searchDocsTool.name]: searchDocsTool,
  [fetchDocTool.name]: fetchDocTool,
  [listPackagesTool.name]: listPackagesTool,
  [getPackageDetailsTool.name]: getPackageDetailsTool,
  [getPackageLogsTool.name]: getPackageLogsTool,
  [getSystemInfoTool.name]: getSystemInfoTool,
  [getDiskUsageTool.name]: getDiskUsageTool,
  [getAvailableUpdatesTool.name]: getAvailableUpdatesTool,
  [listNotificationsTool.name]: listNotificationsTool,
  [diagnoseTool.name]: diagnoseTool,
  [startPackageTool.name]: startPackageTool,
  [stopPackageTool.name]: stopPackageTool,
  [restartPackageTool.name]: restartPackageTool,
  [updatePackageTool.name]: updatePackageTool
};

export const dappnodeToolList: DappnodeTool[] = Object.values(dappnodeTools);
