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
import { packageRestart } from "../calls/packageRestart.js";
import { packageSetEnvironment } from "../calls/packageSetEnvironment.js";
import { packageSetPortMappings } from "../calls/packageSetPortMappings.js";
import { statsCpuGet } from "../calls/statsCpuGet.js";
import { statsMemoryGet } from "../calls/statsMemoryGet.js";
import { statsDiskGet } from "../calls/statsDiskGet.js";
import { systemInfoGet } from "../calls/systemInfoGet.js";
import { diagnose } from "../calls/diagnose.js";
import { autoUpdateDataGet } from "../calls/autoUpdateDataGet.js";
import { notificationsGetAll } from "../calls/notifications.js";
import { searchDocs, fetchDocPage } from "./docs.js";

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
    "Change the staker setup on a network: pick (or clear) the execution/consensus/mev-boost/web3signer clients, and update the mev-boost relay list. Each *DnpName field is optional and defaults to 'unset that slot' (null). This touches multiple packages — ask the user to confirm before calling.",
  mutating: true,
  schema: {
    network: z.nativeEnum(Network).describe("Staker network to configure."),
    executionDnpName: z
      .string()
      .nullable()
      .optional()
      .describe(
        "Execution client dnpName, or null to unset. Omit to leave unchanged is NOT supported — pass null explicitly."
      ),
    consensusDnpName: z.string().nullable().optional().describe("Consensus client dnpName, or null to unset."),
    mevBoostDnpName: z.string().nullable().optional().describe("MEV-boost dnpName, or null to unset."),
    web3signerDnpName: z.string().nullable().optional().describe("Web3signer dnpName, or null to unset."),
    relays: z.array(z.string()).optional().describe("List of MEV-boost relay URLs. Defaults to empty.")
  },
  async execute({
    network,
    executionDnpName = null,
    consensusDnpName = null,
    mevBoostDnpName = null,
    web3signerDnpName = null,
    relays = []
  }: {
    network: Network;
    executionDnpName?: string | null;
    consensusDnpName?: string | null;
    mevBoostDnpName?: string | null;
    web3signerDnpName?: string | null;
    relays?: string[];
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
  displayName: "Get dev package upload info",
  description:
    "Return the upload endpoint details needed to send a `docker save` image tarball to this DAppNode before calling `dappnode_install_dev_package`. The image MUST be uploaded out-of-band via plain HTTP multipart POST (do NOT send binary bytes through MCP). Use this first if you are unsure of the URL, form field name, auth method, or size limit.",
  schema: {},
  async execute() {
    return {
      uploadPath: "/upload",
      formFieldName: "file",
      method: "POST",
      maxFileSizeBytes: 500 * 1024 * 1024,
      maxFiles: 10,
      auth: "Same origin and credentials as /mcp: admin session cookie or Authorization: Bearer <generated MCP API key>",
      responseType: "plain text fileId",
      note: "POST to the same origin you use for /mcp (e.g. http://<your-dappnode>/upload). After uploading, pass the returned fileId as `imageFileId` to dappnode_install_dev_package. Uploaded files expire after 15 minutes. External MCP exposes mutating tools such as dappnode_install_dev_package only when the admin enables mutating MCP tools in System > Advanced; embedded Nexus chat uses its own confirmation flow."
    };
  }
};

const installDevPackageTool: DappnodeTool = {
  name: "dappnode_install_dev_package",
  displayName: "Install dev package",
  description:
    "Install a package you are DEVELOPING into this DAppNode WITHOUT IPFS, so you can test it end-to-end. It is tagged as a dev package and listed under the 'My dev packages' tab (separate from registry packages). Provide the raw dappnode_package.json (manifest) and docker-compose.yml contents, plus `imageFileId`: the fileId returned by uploading a `docker save` tarball to this DAppNode's `/upload` endpoint. The image inside the tarball MUST be tagged exactly `<service>.<dnpName>:<version>` — build it first with `docker compose build`, then `docker save <image> -o <tar>`, upload the tar to `/upload`, and pass the returned fileId here. Always run dappnode_validate_package first. This mutates state and starts containers — confirm with the user before calling. To re-install an updated build, run it again with the same name.",
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
        "File ID returned by the `/upload` endpoint for the `docker save` image tarball. Upload the tar out-of-band (multipart/form-data, field name 'file') and pass the returned fileId here."
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
  [getSystemInfoTool.name]: getSystemInfoTool,
  [getDiskUsageTool.name]: getDiskUsageTool,
  [getAvailableUpdatesTool.name]: getAvailableUpdatesTool,
  [listNotificationsTool.name]: listNotificationsTool,
  [diagnoseTool.name]: diagnoseTool,
  [startPackageTool.name]: startPackageTool,
  [stopPackageTool.name]: stopPackageTool,
  [restartPackageTool.name]: restartPackageTool,
  [updatePackageTool.name]: updatePackageTool,
  [getStakerConfigTool.name]: getStakerConfigTool,
  [setStakerConfigTool.name]: setStakerConfigTool,
  [setPackageEnvironmentTool.name]: setPackageEnvironmentTool,
  [setPackagePortMappingsTool.name]: setPackagePortMappingsTool,
  [validatePackageTool.name]: validatePackageTool,
  [getDevUploadInfoTool.name]: getDevUploadInfoTool,
  [installDevPackageTool.name]: installDevPackageTool,
  [searchRegistryTool.name]: searchRegistryTool,
  [fetchInstallPreviewTool.name]: fetchInstallPreviewTool,
  [installPackageTool.name]: installPackageTool
};

export const dappnodeToolList: DappnodeTool[] = Object.values(dappnodeTools);
