#!/usr/bin/env node
// Run separately from Dappmanager: stopping its network must not stop migration.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export interface NetworkPolicy {
  version: number;
  networks: Record<string, BridgePolicy>;
  dynamicNetworks: string[];
}
interface BridgePolicy {
  subnet: string;
  gateway: string;
  ipRange: string;
  fixed: Record<string, string>;
}
interface IPAMConfig {
  Subnet: string;
  Gateway?: string;
  IPRange?: string;
  AuxiliaryAddresses?: Record<string, string>;
}
export interface NetworkOptions {
  Name: string;
  Driver: string;
  EnableIPv6?: boolean;
  Internal?: boolean;
  Attachable?: boolean;
  Options?: Record<string, string>;
  Labels?: Record<string, string>;
  IPAM: { Driver?: string; Options?: Record<string, string>; Config: IPAMConfig[] };
}
export interface DockerNetwork extends NetworkOptions {
  Id?: string;
  Scope: string;
  Containers?: Record<string, unknown>;
}
interface EndpointIPAM {
  IPv4Address?: string;
  IPv6Address?: string;
  LinkLocalIPs?: string[];
}
export interface DockerEndpoint {
  IPAddress?: string;
  IPAMConfig?: EndpointIPAM | null;
  Aliases?: string[] | null;
  Links?: string[] | null;
  DriverOpts?: Record<string, string> | null;
  GwPriority?: number | null;
  NetworkID?: string;
}
interface Endpoint {
  Aliases: string[];
  IPAMConfig: EndpointIPAM;
  DriverOpts?: Record<string, string>;
  GwPriority?: number;
  MacAddress?: string;
}
export interface Mount {
  Source: string;
  Destination: string;
  Type?: string;
  Name?: string;
  RW?: boolean;
  Mode?: string;
  Driver?: string;
  Propagation?: string;
}
interface RestartPolicy {
  Name: string;
  MaximumRetryCount?: number;
}
export interface Container {
  Id: string;
  Name: string;
  Image: string;
  Mounts: Mount[];
  HostConfig: { RestartPolicy: RestartPolicy };
  State: {
    Running: boolean;
    Paused?: boolean;
    Restarting?: boolean;
    Dead?: boolean;
    ExitCode?: number;
    StartedAt?: string;
  };
  Config: { Labels: Record<string, string> | null };
  NetworkSettings: { Networks: Record<string, DockerEndpoint> };
}
interface ComposeEndpoint {
  ipv4_address?: string;
  ipv6_address?: string;
  link_local_ips?: string[];
  aliases?: string[];
  mac_address?: string;
}
export type Intent = Record<string, ComposeEndpoint>;
interface ComposeConfig {
  services?: Record<string, { networks?: string[] | Record<string, ComposeEndpoint | null> }>;
  networks?: Record<string, { name?: string }>;
}
export type ComposeCache = Map<string, ComposeConfig>;
interface PlannedContainer {
  id: string;
  name: string;
  image: string;
  mounts: Mount[];
  restartPolicy: RestartPolicy;
  running: boolean;
  intentHash: string;
  original: Record<string, Endpoint>;
  desired: Record<string, Endpoint>;
}
export interface MigrationPlan {
  version: number;
  policyHash: string;
  networks: { original: NetworkOptions; desired: NetworkOptions; recreate: boolean }[];
  containers: PlannedContainer[];
  fingerprint: string;
}
type Phase =
  | "prepared"
  | "stopping"
  | "disconnecting"
  | "networks"
  | "connecting"
  | "starting"
  | "rollback-stopping"
  | "rollback-disconnecting"
  | "rollback-networks"
  | "rollback-connecting"
  | "rollback-starting"
  | "verifying"
  | "rolled-back"
  | "completed";
export interface MigrationState {
  phase: Phase;
  plan: MigrationPlan;
  createdAt?: string;
  direction?: "apply" | "rollback";
  networkMutationStarted?: boolean;
  forcedStops?: string[];
  completedJobs?: string[];
}
interface LockOwner {
  host?: string;
  pid?: number;
  container?: string;
  started?: string;
}
export interface DockerClient {
  request<T = void>(method: string, route: string, data?: unknown, allowed?: number[]): Promise<T>;
  inspect(id: string): Promise<Container>;
}
type Controller = { name: string; mounts: Pick<Mount, "Destination">[] };

const policyUrl = ["dist", "src"]
  .map((dir) => new URL(`../packages/params/${dir}/dockerNetworkPolicy.json`, import.meta.url))
  .find((url) => fs.existsSync(url));
export const defaultPolicy: NetworkPolicy = JSON.parse(fs.readFileSync(policyUrl!, "utf8"));
const managerName = "DAppNodeCore-dappmanager.dnp.dappnode.eth";
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical((value as Record<string, unknown>)[key])])
        )
      : value;
const hash = (value: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
const clone = <T>(value: T): T => structuredClone(value);

function ipv4Number(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d+$/.test(p) || Number(p) > 255))
    throw new Error(`Invalid IPv4 address: ${ip}`);
  return parts.reduce((n, p) => n * 256 + Number(p), 0);
}
function subnetBounds(cidr: string): [number, number] {
  const [base, bits] = cidr.split("/");
  if (!/^\d+$/.test(bits) || Number(bits) > 32) throw new Error(`Invalid subnet: ${cidr}`);
  const size = 2 ** (32 - Number(bits));
  const first = Math.floor(ipv4Number(base) / size) * size;
  return [first, first + size - 1];
}
export function inSubnet(address: string, cidr: string) {
  const [first, last] = subnetBounds(cidr),
    value = ipv4Number(address);
  return value >= first && value <= last;
}

export class Docker implements DockerClient {
  declare socketPath: string;
  declare versionPromise?: Promise<void>;
  declare apiVersion?: string;
  constructor(socketPath = process.env.DOCKER_SOCKET || "/var/run/docker.sock") {
    this.socketPath = socketPath;
  }
  async request<T = void>(method: string, route: string, data?: unknown, allowed = [200, 201, 204, 304]): Promise<T> {
    if (route !== "/version") {
      this.versionPromise ||= this.request<{ ApiVersion: string }>("GET", "/version").then((info) => {
        if (!/^\d+\.\d+$/.test(info.ApiVersion)) throw new Error("Invalid Docker API version");
        this.apiVersion = info.ApiVersion;
      });
      await this.versionPromise;
    }
    return await new Promise<T>((resolve, reject) => {
      const body = data === undefined ? undefined : JSON.stringify(data);
      const request = http.request(
        {
          socketPath: this.socketPath,
          method,
          path: `${route === "/version" ? "" : `/v${this.apiVersion}`}${route}`,
          headers: body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {}
        },
        (response) => {
          let text = "";
          response.setEncoding("utf8");
          response.on("data", (part) => {
            text += part;
          });
          response.on("end", () => {
            let result;
            try {
              result = text ? JSON.parse(text) : null;
            } catch {
              return reject(new Error("Invalid Docker API response"));
            }
            if (!allowed.includes(response.statusCode!)) {
              const error = new Error(`Docker ${method} ${route}: ${result?.message || response.statusCode}`);
              Object.assign(error, { statusCode: response.statusCode });
              reject(error);
            } else resolve(response.statusCode === 404 ? null : result);
          });
        }
      );
      request.setTimeout(route.includes("/stop") ? 600000 : 120000, () =>
        request.destroy(new Error(`Docker request timed out: ${route}`))
      );
      request.on("error", reject);
      request.end(body);
    });
  }
  async inventory() {
    const list = await this.request<{ Id: string }[]>("GET", "/containers/json?all=true");
    const containers = await Promise.all(list.map((c) => this.inspect(c.Id)));
    const networks = await this.request<DockerNetwork[]>("GET", "/networks");
    return { containers, networks };
  }
  async inspect(id: string): Promise<Container> {
    return await this.request<Container>("GET", `/containers/${encodeURIComponent(id)}/json`);
  }
}

// Use the same Compose resolver as installation: merges, .env and external names.
// Only network intent is retained in the journal, never environment credentials.
export function resolveComposePath(file: string, mounts: Mount[] = []) {
  if (fs.existsSync(file)) return file;
  for (const mount of [...mounts].sort((a, b) => b.Source.length - a.Source.length)) {
    if (file !== mount.Source && !file.startsWith(`${mount.Source}/`)) continue;
    const translated = path.join(mount.Destination, file.slice(mount.Source.length));
    if (fs.existsSync(translated)) return translated;
  }
  return file;
}
export function composeIntent(container: Container, cache: ComposeCache = new Map(), mounts: Mount[] = []): Intent {
  const labels = container.Config.Labels || {};
  const files = labels["com.docker.compose.project.config_files"]
    ?.split(",")
    .map((file) => resolveComposePath(file, mounts));
  const service = labels["com.docker.compose.service"];
  const project = labels["com.docker.compose.project"];
  if (!files?.length || !service || !project) throw new Error(`Missing Compose provenance: ${container.Name}`);
  const directory = resolveComposePath(
    labels["com.docker.compose.project.working_dir"] || path.dirname(files[0]),
    mounts
  );
  const key = JSON.stringify([files, project, directory]);
  let compose = cache.get(key);
  if (!compose) {
    const args = [
      "compose",
      "--project-directory",
      directory,
      "-p",
      project,
      ...files.flatMap((file) => ["-f", file]),
      "config",
      "--format",
      "json"
    ];
    try {
      compose = JSON.parse(
        execFileSync("docker", args, {
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
          stdio: ["ignore", "pipe", "pipe"]
        })
      ) as ComposeConfig;
    } catch {
      throw new Error(`Cannot resolve Compose configuration for ${container.Name}; no changes made`);
    }
    cache.set(key, compose);
  }
  if (!compose.services?.[service]) throw new Error(`Compose service missing: ${container.Name}`);
  const declared = compose.services[service].networks || {};
  const networks: Intent = {};
  for (const [key, value] of Object.entries(
    Array.isArray(declared) ? Object.fromEntries(declared.map((n) => [n, {}])) : declared
  ))
    networks[compose.networks?.[key]?.name || key] = value || {};
  return networks;
}

export function networkCreateOptions(network: NetworkOptions, replacement?: BridgePolicy): NetworkOptions {
  const options = {} as NetworkOptions;
  for (const key of ["Name", "Driver", "EnableIPv6", "Internal", "Attachable", "Options", "Labels", "IPAM"] as const)
    if (network[key] !== undefined) Object.assign(options, { [key]: clone(network[key]) });
  if (replacement)
    options.IPAM.Config = options.IPAM.Config.map((config) =>
      config.Subnet === replacement.subnet
        ? { ...config, IPRange: replacement.ipRange, Gateway: config.Gateway || replacement.gateway }
        : config
    );
  return options;
}

function desiredEndpoint(old: DockerEndpoint, intent: ComposeEndpoint, fixed?: string): Endpoint {
  const endpoint: Endpoint = { Aliases: old.Aliases || [], IPAMConfig: {} };
  const ip = fixed || intent.ipv4_address;
  if (ip) endpoint.IPAMConfig.IPv4Address = ip;
  if (intent.ipv6_address) endpoint.IPAMConfig.IPv6Address = intent.ipv6_address;
  if (intent.link_local_ips) endpoint.IPAMConfig.LinkLocalIPs = intent.link_local_ips;
  for (const key of ["DriverOpts", "GwPriority"] as const)
    if (old[key] !== undefined && old[key] !== null) Object.assign(endpoint, { [key]: old[key] });
  if (intent.mac_address) endpoint.MacAddress = intent.mac_address;
  return endpoint;
}

export function buildPlan({
  containers,
  networks,
  intents,
  policy = defaultPolicy
}: {
  containers: Container[];
  networks: DockerNetwork[];
  intents: Record<string, Intent>;
  policy?: NetworkPolicy;
}): MigrationPlan {
  const names = new Set([...Object.keys(policy.networks), ...(policy.dynamicNetworks || [])]);
  const selected = networks.filter((network) => names.has(network.Name));
  const errors = [];
  const plannedNetworks = selected.map((network) => {
    const replacement = policy.networks[network.Name];
    if (network.Driver !== "bridge" || network.Scope !== "local" || network.IPAM?.Driver !== "default")
      errors.push(`Unsupported network driver/scope/IPAM: ${network.Name}`);
    if (replacement && !network.IPAM?.Config?.some((config) => config.Subnet === replacement.subnet))
      errors.push(`Unexpected subnet for ${network.Name}; requires a separate subnet migration`);
    return {
      original: networkCreateOptions(network),
      desired: networkCreateOptions(network, replacement),
      recreate:
        Boolean(replacement) && hash(networkCreateOptions(network)) !== hash(networkCreateOptions(network, replacement))
    };
  });
  const targets: PlannedContainer[] = [];
  for (const container of containers) {
    const attached = Object.keys(container.NetworkSettings.Networks).filter((name) => names.has(name));
    if (!attached.length) continue;
    const labels = container.Config.Labels || {};
    const legacyCore =
      container.Name === `/DAppNodeCore-${labels["com.docker.compose.service"]}` &&
      labels["com.docker.compose.project"] === "dncore";
    if (!labels["dappnode.dnp.dnpName"] && !legacyCore)
      errors.push(`Unmanaged container attached to a Dappnode network: ${container.Name}`);
    const intent = intents[container.Id];
    if (!intent) {
      errors.push(`No resolved Compose configuration: ${container.Name}`);
      continue;
    }
    if (container.State.Paused || container.State.Restarting || container.State.Dead)
      errors.push(`Container must be stable before migration: ${container.Name}`);
    const original: Record<string, Endpoint> = {},
      desired: Record<string, Endpoint> = {};
    const name = container.Name.replace(/^\//, "");
    for (const networkName of attached) {
      const endpoint = container.NetworkSettings.Networks[networkName];
      original[networkName] = desiredEndpoint(endpoint, {
        ipv4_address: endpoint.IPAMConfig?.IPv4Address,
        ipv6_address: endpoint.IPAMConfig?.IPv6Address,
        link_local_ips: endpoint.IPAMConfig?.LinkLocalIPs
      });
      const configured = intent[networkName] || {};
      const networkPolicy = policy.networks[networkName];
      const fixed = networkPolicy?.fixed?.[name];
      if (fixed && configured.ipv4_address && configured.ipv4_address !== fixed)
        errors.push(`Configured IP conflicts with the required core IP: ${name} on ${networkName}`);
      if (endpoint.Links?.length) errors.push(`Legacy network links require manual migration: ${name}`);
      desired[networkName] = desiredEndpoint(endpoint, configured, fixed);
      const ip = desired[networkName].IPAMConfig.IPv4Address;
      if (ip) {
        const config = selected
          .find((n) => n.Name === networkName)
          ?.IPAM.Config.find((c) => c.Subnet && inSubnet(ip, c.Subnet));
        if (!config) errors.push(`Static IP ${ip} is outside network ${networkName}`);
        else if (
          subnetBounds(config.Subnet).includes(ipv4Number(ip)) ||
          config.Gateway === ip ||
          Object.values(config.AuxiliaryAddresses || {}).includes(ip)
        )
          errors.push(`Static IP ${ip} is reserved by network ${networkName}`);
      }
      if (ip && networkPolicy) {
        if (!inSubnet(ip, networkPolicy.subnet) || inSubnet(ip, networkPolicy.ipRange))
          errors.push(`Static IP ${ip} for ${name} must be in the subnet and outside ${networkPolicy.ipRange}`);
        const reservedOwner = Object.entries(networkPolicy.fixed).find(([, value]) => value === ip)?.[0];
        if (reservedOwner && reservedOwner !== name) errors.push(`IP ${ip} is reserved for ${reservedOwner}`);
      }
    }
    targets.push({
      id: container.Id,
      name,
      image: container.Image,
      mounts: container.Mounts,
      restartPolicy: container.HostConfig.RestartPolicy,
      running: container.State.Running,
      intentHash: hash(intent),
      original,
      desired
    });
  }
  for (const network of selected) {
    const ips = new Set();
    let dynamic = 0;
    for (const target of targets) {
      const endpoint = target.desired[network.Name];
      if (!endpoint) continue;
      const ip = endpoint.IPAMConfig.IPv4Address;
      if (ip && ips.has(ip)) errors.push(`Duplicate configured static IP ${ip} on ${network.Name}`);
      if (ip) ips.add(ip);
      else dynamic++;
    }
    const range = policy.networks[network.Name]?.ipRange;
    if (range) {
      // Conservative capacity includes stopped endpoints and leaves pool edges free.
      const capacity = 2 ** (32 - Number(range.split("/")[1])) - 2;
      const auxiliary = network.IPAM.Config.flatMap((c) => Object.values(c.AuxiliaryAddresses || {}));
      const reserved = auxiliary.filter((ip) => inSubnet(ip, range)).length;
      if (dynamic > capacity - reserved)
        errors.push(`${network.Name} has ${dynamic} dynamic endpoints; capacity is ${capacity - reserved}`);
    }
  }
  if (errors.length) throw new Error(`Migration preflight failed:\n${errors.join("\n")}`);
  const plan = { version: 1, policyHash: hash(policy), networks: plannedNetworks, containers: targets };
  return { ...plan, fingerprint: hash(plan) };
}

export async function inspectPlan(docker: Docker, policy = defaultPolicy) {
  const inventory = await docker.inventory();
  const names = new Set([...Object.keys(policy.networks), ...(policy.dynamicNetworks || [])]);
  const cache: ComposeCache = new Map(),
    intents: Record<string, Intent> = {};
  const mounts = inventory.containers.find((c) => c.Name === `/${managerName}`)?.Mounts || [];
  for (const container of inventory.containers)
    if (Object.keys(container.NetworkSettings.Networks).some((name) => names.has(name)))
      intents[container.Id] = composeIntent(container, cache, mounts);
  return buildPlan({ ...inventory, intents, policy });
}

export function summary(plan: MigrationPlan) {
  return {
    fingerprint: plan.fingerprint,
    networks: plan.networks.map((n) => ({ name: n.original.Name, recreate: n.recreate, ipam: n.desired.IPAM })),
    containers: plan.containers.map((c) => ({
      name: c.name,
      running: c.running,
      changes: Object.entries(c.desired)
        .filter(([n, e]) => hash(e) !== hash(c.original[n]))
        .map(([network, e]) => ({ network, from: c.original[network].IPAMConfig, to: e.IPAMConfig }))
    }))
  };
}

export class Journal {
  declare directory: string;
  constructor(directory: string) {
    this.directory = directory;
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  read<T = MigrationState>(name = "journal.json"): T {
    return JSON.parse(fs.readFileSync(path.join(this.directory, name), "utf8"));
  }
  write(value: unknown, name = "journal.json") {
    const dest = path.join(this.directory, name),
      temp = `${dest}.${randomUUID()}.tmp`;
    const fd = fs.openSync(temp, "wx", 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(value, null, 2) + "\n");
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temp, dest);
    const dir = fs.openSync(this.directory, "r");
    try {
      fs.fsyncSync(dir);
    } finally {
      fs.closeSync(dir);
    }
  }
  async lock(docker: Pick<DockerClient, "inspect">) {
    const file = path.join(this.directory, "lock.json");
    let owner: LockOwner = { host: os.hostname(), pid: process.pid };
    if (process.env.MIGRATION_CONTAINER) {
      const c = await docker.inspect(process.env.MIGRATION_CONTAINER);
      owner = { container: c.Id, started: c.State.StartedAt };
    }
    if (fs.existsSync(file)) {
      const old = JSON.parse(fs.readFileSync(file, "utf8"));
      let active = false;
      if (old.container) {
        try {
          const c = await docker.inspect(old.container);
          active = c.State.Running && c.State.StartedAt === old.started;
        } catch (error) {
          if (!(error instanceof Error) || !("statusCode" in error) || error.statusCode !== 404) throw error;
        }
      } else if (old.host === os.hostname()) {
        try {
          process.kill(old.pid!, 0);
          active = true;
        } catch (error) {
          if (!(error instanceof Error) || !("code" in error) || error.code !== "ESRCH") throw error;
        }
      } else throw new Error("Cannot establish whether the migration lock owner is still active");
      if (active) throw new Error("Another migration process holds the lock");
      fs.unlinkSync(file);
    }
    fs.writeFileSync(file, JSON.stringify(owner), { flag: "wx", mode: 0o600 });
    return () => fs.unlinkSync(file);
  }
}

async function validateIdentities(docker: DockerClient, plan: MigrationPlan) {
  for (const c of plan.containers) {
    const current = await docker.inspect(c.id);
    if (
      current.Name !== `/${c.name}` ||
      current.Image !== c.image ||
      hash(current.Mounts) !== hash(c.mounts) ||
      hash(current.HostConfig.RestartPolicy) !== hash(c.restartPolicy)
    )
      throw new Error(`Container identity, mounts, image or restart policy changed: ${c.name}`);
  }
}

const coreJobName = "DAppNodeCore-core.dnp.dappnode.eth";
const oneShot = (c: PlannedContainer) => ["no", "on-failure"].includes(c.restartPolicy.Name);
const controlsDocker = (c: Controller) => c.mounts.some((m) => m.Destination === "/var/run/docker.sock");
export const shutdownPriority = (c: Controller) =>
  c.name === coreJobName ? 0 : c.name === managerName ? 2 : controlsDocker(c) ? 1 : 3;

async function stopContainers(docker: DockerClient, plan: MigrationPlan, state: MigrationState, journal: Journal) {
  const ordered = [...plan.containers].sort((a, b) => shutdownPriority(a) - shutdownPriority(b));
  for (const c of ordered) {
    const before = (await docker.inspect(c.id)).State;
    if (!before.Running) {
      if (c.running && oneShot(c) && before.ExitCode === 0) {
        state.completedJobs = [...new Set([...(state.completedJobs || []), c.name])];
        journal.write(state);
      }
      continue;
    }
    // Honor each image/Compose StopTimeout and Docker's default, just like an
    // ordinary stop. A fixed timeout here would override package shutdown policy.
    await docker.request("POST", `/containers/${c.id}/stop`);
    const currentState = (await docker.inspect(c.id)).State;
    if (currentState.Running) throw new Error(`Container failed to stop: ${c.name}`);
    if (currentState.ExitCode === 137) {
      const message = `Docker required a forced stop for ${c.name}; container data is retained in place`;
      console.warn(message);
      // No container or database files are copied: retain normal Docker stop /
      // restart crash-recovery semantics for legacy images without signal forwarding.
      state.forcedStops = [...new Set([...(state.forcedStops || []), c.name])];
      journal.write(state);
    }
  }
  for (const c of plan.containers)
    if ((await docker.inspect(c.id)).State.Running)
      throw new Error(`Container restarted during shutdown; networking is unchanged: ${c.name}`);
}

async function disconnect(docker: DockerClient, plan: MigrationPlan) {
  for (const c of plan.containers) {
    const current = await docker.inspect(c.id);
    for (const name of Object.keys(c.original))
      if (current.NetworkSettings.Networks[name])
        await docker.request("POST", `/networks/${encodeURIComponent(name)}/disconnect`, { Container: c.id });
  }
}

async function restoreNetworks(docker: DockerClient, plan: MigrationPlan, rollback: boolean) {
  for (const n of plan.networks) {
    if (!n.recreate) continue;
    const expected = rollback ? n.original : n.desired;
    const current = await docker.request<DockerNetwork | null>(
      "GET",
      `/networks/${encodeURIComponent(n.original.Name)}`,
      undefined,
      [200, 404]
    );
    if (current && hash(networkCreateOptions(current)) === hash(expected)) continue;
    if (current) {
      if (Object.keys(current.Containers || {}).length)
        throw new Error(`Network gained unexpected endpoints: ${n.original.Name}`);
      await docker.request("DELETE", `/networks/${current.Id}`);
    }
    await docker.request("POST", "/networks/create", expected);
  }
}

async function connect(docker: DockerClient, plan: MigrationPlan, rollback: boolean) {
  for (const c of plan.containers)
    for (const [name, endpoint] of Object.entries(rollback ? c.original : c.desired))
      await docker.request("POST", `/networks/${encodeURIComponent(name)}/connect`, {
        Container: c.id,
        EndpointConfig: endpoint
      });
}

async function startContainers(docker: DockerClient, plan: MigrationPlan, rollback: boolean, state: MigrationState) {
  const priority = (c: PlannedContainer) =>
    c.name === coreJobName
      ? 5
      : c.name === managerName
        ? 4
        : controlsDocker(c)
          ? 3
          : c.name.startsWith("DAppNodeCore-bind.")
            ? 0
            : Object.values(rollback ? c.original : c.desired).some((e) => e.IPAMConfig.IPv4Address)
              ? 1
              : 2;
  for (const c of [...plan.containers].sort((a, b) => priority(a) - priority(b)))
    if (c.running && !state.completedJobs?.includes(c.name)) await docker.request("POST", `/containers/${c.id}/start`);
}

export async function verify(docker: DockerClient, plan: MigrationPlan, rollback = false) {
  await validateIdentities(docker, plan);
  for (const n of plan.networks) {
    const current = await docker.request<DockerNetwork>("GET", `/networks/${encodeURIComponent(n.original.Name)}`);
    if (hash(networkCreateOptions(current)) !== hash(rollback ? n.original : n.desired))
      throw new Error(`Network configuration differs: ${n.original.Name}`);
  }
  for (const c of plan.containers) {
    const current = await docker.inspect(c.id);
    const jobCompleted = c.running && oneShot(c) && !current.State.Running && current.State.ExitCode === 0;
    if (current.State.Running !== c.running && !jobCompleted) throw new Error(`Running state differs: ${c.name}`);
    for (const [name, expected] of Object.entries(rollback ? c.original : c.desired)) {
      const actual = current.NetworkSettings.Networks[name];
      if (!actual || expected.Aliases.some((a) => !actual.Aliases?.includes(a)))
        throw new Error(`Network/alias missing: ${c.name} ${name}`);
      for (const field of ["IPv4Address", "IPv6Address"] as const)
        if ((expected.IPAMConfig[field] || "") !== (actual.IPAMConfig?.[field] || ""))
          throw new Error(`Addressing intent differs: ${c.name} ${name}`);
      if (
        current.State.Running &&
        expected.IPAMConfig.IPv4Address &&
        actual.IPAddress !== expected.IPAMConfig.IPv4Address
      )
        throw new Error(`Static address differs: ${c.name} ${name}`);
      const range = plan.networks
        .find((n) => n.original.Name === name)
        ?.desired.IPAM.Config.find((c) => c.IPRange)?.IPRange;
      if (
        !rollback &&
        current.State.Running &&
        !expected.IPAMConfig.IPv4Address &&
        range &&
        (!actual.IPAddress || !inSubnet(actual.IPAddress!, range))
      )
        throw new Error(`Dynamic address is outside its pool: ${c.name} ${name}`);
    }
  }
}

async function verifySettled(docker: DockerClient, plan: MigrationPlan, rollback: boolean) {
  for (let attempt = 0; ; attempt++) {
    try {
      await verify(docker, plan, rollback);
      return;
    } catch (error) {
      if (attempt >= 30) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Each phase is replayable after process or daemon loss. Resume always uses the
// original journal, never a fresh inventory of the partially migrated network.
export async function execute(
  docker: DockerClient,
  journal: Journal,
  state: MigrationState,
  rollback = false,
  checkpoint: (phase: Phase) => Promise<void> = async () => {}
) {
  const { plan } = state;
  state.direction = rollback ? "rollback" : "apply";
  await validateIdentities(docker, plan);
  const phase = async (name: Phase, fn: () => Promise<void>) => {
    state.phase = name;
    journal.write(state);
    console.log(name);
    await fn();
    await checkpoint(name);
  };
  if (rollback && !state.networkMutationStarted) {
    // A failure during shutdown has not touched networking. Restore only the
    // stopped services rather than disrupting the remaining running services.
    await phase("rollback-starting", () => startContainers(docker, plan, true, state));
    await phase("verifying", () => verifySettled(docker, plan, true));
    state.phase = "rolled-back";
    journal.write(state);
    return;
  }
  await phase(rollback ? "rollback-stopping" : "stopping", () => stopContainers(docker, plan, state, journal));
  await phase(rollback ? "rollback-disconnecting" : "disconnecting", async () => {
    state.networkMutationStarted = true;
    journal.write(state);
    await disconnect(docker, plan);
  });
  await phase(rollback ? "rollback-networks" : "networks", () => restoreNetworks(docker, plan, rollback));
  await phase(rollback ? "rollback-connecting" : "connecting", () => connect(docker, plan, rollback));
  await phase(rollback ? "rollback-starting" : "starting", () => startContainers(docker, plan, rollback, state));
  await phase("verifying", () => verifySettled(docker, plan, rollback));
  state.phase = rollback ? "rolled-back" : "completed";
  journal.write(state);
}

export async function main(args = process.argv.slice(2)) {
  const [command, ...options] = args;
  if (
    !["plan", "apply", "resume", "retry", "rollback", "status"].includes(command) ||
    options.length > 2 ||
    (options.length && (options[0] !== "--state-dir" || !options[1]))
  )
    throw new Error(
      "Usage: docker-network-migration.ts plan|apply|resume|retry|rollback|status [--state-dir DIRECTORY]"
    );
  const journal = new Journal(options[1] || "/state"),
    docker = new Docker();
  if (command === "status") {
    const state = journal.read();
    console.log(JSON.stringify({ phase: state.phase, ...summary(state.plan) }, null, 2));
    return;
  }
  const unlock = await journal.lock(docker);
  try {
    if (command === "plan") {
      const plan = await inspectPlan(docker);
      journal.write(plan, "plan.json");
      console.log(JSON.stringify(summary(plan), null, 2));
      return;
    }
    let state: MigrationState;
    if (command === "apply") {
      const previous = fs.existsSync(path.join(journal.directory, "journal.json")) ? journal.read() : null;
      if (previous && previous.phase !== "rolled-back")
        throw new Error("A migration journal exists; use status, resume or rollback");
      const plan = await inspectPlan(docker),
        approved = journal.read<MigrationPlan>("plan.json");
      if (plan.fingerprint !== approved.fingerprint) throw new Error("Inventory changed since plan; run plan again");
      if (previous) journal.write(previous, `history-${randomUUID()}.json`);
      state = { phase: "prepared", createdAt: new Date().toISOString(), plan };
      journal.write(state);
    } else {
      state = journal.read();
      if (state.plan.policyHash !== hash(defaultPolicy))
        throw new Error("Migration policy differs from journal; use the original image");
      if (["resume", "retry"].includes(command) && state.phase === "completed") {
        await verify(docker, state.plan);
        console.log("completed");
        return;
      }
      if (command === "rollback" && state.phase === "rolled-back") {
        await verify(docker, state.plan, true);
        console.log("rolled-back");
        return;
      }
      const cache: ComposeCache = new Map();
      const mounts = (await docker.inspect(managerName)).Mounts;
      for (const c of state.plan.containers)
        if (hash(composeIntent(await docker.inspect(c.id), cache, mounts)) !== c.intentHash)
          throw new Error(`Compose network configuration changed: ${c.name}`);
    }
    try {
      await execute(
        docker,
        journal,
        state,
        command === "rollback" || (command !== "retry" && state.direction === "rollback")
      );
    } catch (error) {
      if (command === "rollback" || state.direction === "rollback") throw error;
      console.error(
        `Migration failed: ${error instanceof Error ? error.message : String(error)}; restoring original configuration`
      );
      try {
        await execute(docker, journal, state, true);
      } catch (rollbackError) {
        throw new Error(
          `${error instanceof Error ? error.message : String(error)}; rollback incomplete: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}. Keep the journal and run rollback.`
        );
      }
      throw new Error(`${error instanceof Error ? error.message : String(error)}; original configuration restored`);
    }
  } finally {
    unlock();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
