import type { InstalledPackageData, PackageContainer } from "@dappnode/types";
import type { FetchLike, LoggerLike, NexusToolSummary } from "./types.js";
import { stripMdFromDocsUrls } from "./utils.js";

const LLMS_TXT_URL = "https://docs.dappnode.io/llms.txt";
const LLMS_TXT_TTL_MS = 24 * 60 * 60 * 1000;
const LLMS_TXT_MAX_BYTES = 60_000;
const PACKAGE_LIST_TTL_MS = 60_000;

export interface NexusContextDeps {
  fetch: FetchLike;
  logger: LoggerLike;
  now: () => number;
  listPackages(): Promise<InstalledPackageData[]>;
  toolList: NexusToolSummary[];
  startDocsWarmup?: () => void;
}

export class NexusContextBuilder {
  private llmsCache: { fetchedAt: number; content: string } | null = null;
  private llmsInflight: Promise<string> | null = null;
  private packageListCache: { fetchedAt: number; content: string } | null = null;

  constructor(private readonly deps: NexusContextDeps) {}

  async buildSystemPrompt(pageContext?: unknown): Promise<string> {
    this.deps.startDocsWarmup?.();

    const [docsIndex, packageList] = await Promise.all([this.fetchLlmsContext(), this.describeInstalledPackages()]);

    const today = new Date(this.deps.now()).toISOString().slice(0, 10);
    const parts: string[] = [
      "You are an AI assistant embedded inside a user's Dappnode - a personal, sovereign node for Web3 infrastructure (staking, validators, dApps, AI inference).",
      `Today is ${today}.`,
      "",
      "## How to answer",
      "",
      "**The official docs at docs.dappnode.io are the source of truth.** For ANY question about DAppNode - concepts, packages, configuration, troubleshooting, staking, networking, VPN access, validators, Smooth, the DAO, hardware, installation - you MUST consult the docs via tools, NOT your training data. Training-data knowledge of DAppNode is often outdated or wrong; the docs are not.",
      "",
      "Workflow for any DAppNode-specific question:",
      "1. Call `dappnode_search_docs(query)` with the user's keywords.",
      "2. Read the returned snippets. If they answer the question, summarize them and cite the page URL.",
      "3. If a snippet isn't enough, call `dappnode_fetch_doc(url)` to read the full page.",
      "4. Only AFTER consulting the docs do you answer. If the docs don't cover it, say so explicitly.",
      "",
      'For questions about THIS Dappnode\'s runtime state ("is X running", "what\'s eating my disk"), use the runtime tools (`dappnode_list_packages`, `dappnode_get_package_logs`, `dappnode_diagnose`, etc.) instead of guessing from the package snapshot below.',
      "",
      "Be concise and direct. Use markdown (lists, headings, fenced code blocks) when it helps. When referring to a specific installed package, use its exact `dnpName`. When citing docs, link the URL.",
      "",
      "**Docs URL rule:** When you cite a docs.dappnode.io URL to the user, NEVER include a trailing `.md`. The `.md` form (e.g. `.../wireguard.md`) is the raw-markdown variant used internally by the docs-fetch tool - humans visit the same URL without `.md` (e.g. `.../wireguard`). If a doc page's content links to another page using a `.md` URL, drop the `.md` before showing it to the user.",
      "",
      "**Local URL rule:** When giving the user a link to this DAppNode's UI or a package, use the `my.dappnode` host (e.g. `http://my.dappnode/...`). NEVER use `dappnode.local` - it is deprecated. If docs or other context show a `dappnode.local` URL, rewrite the host to `my.dappnode` before showing it.",
      "",
      "## Staking facts you MUST NOT get wrong",
      "",
      "On DAppNode, a staking setup with a **Web3Signer** package (e.g. `web3signer-<network>.dnp.dappnode.eth`) manages validator keys AND per-validator settings through its `brain` service. In that setup:",
      "- **The fee recipient (rewards address) is configured in Web3Signer / the Staker UI, NOT in the consensus/validator client.** Web3Signer serves the fee recipient and validator registrations to the beacon node per-validator.",
      "- The validator/consensus client's `FEE_RECIPIENT_ADDRESS` env var (often `0x0000000000000000000000000000000000000000`) is only a **fallback** that is overridden by Web3Signer. A `0x0` value there is NORMAL and does NOT mean the setup is misconfigured - do NOT report it as a problem or tell the user their rewards are being burned. The real, effective fee recipient is whatever Web3Signer holds (this is what shows up on-chain / on beaconcha.in).",
      "- To read or change the fee recipient, point the user to Web3Signer's config / the Staker config page - not the consensus client's env vars.",
      "- Likewise, MEV-Boost relay registration is handled through Web3Signer/Staker config. If beaconcha.in shows a correct fee recipient, the setup is working regardless of the client's fallback env value.",
      ""
    ];

    const pageBlock = describePageContext(pageContext);
    if (pageBlock) parts.push(pageBlock);

    if (docsIndex) {
      parts.push("================ DAPPNODE DOCS - INDEX ONLY (from docs.dappnode.io/llms.txt) ================");
      parts.push(
        "This is the catalogue of available pages, NOT the docs themselves. To read a page's contents, call `dappnode_search_docs` or `dappnode_fetch_doc`."
      );
      parts.push("");
      parts.push(docsIndex);
      parts.push("================ END DAPPNODE DOCS INDEX ================");
      parts.push("");
    }

    parts.push("================ INSTALLED PACKAGES ON THIS DAPPNODE ================");
    parts.push(packageList);
    parts.push("================ END INSTALLED PACKAGES ================");
    parts.push("");

    const mutating = this.deps.toolList.filter((tool) => tool.mutating).map((tool) => tool.name);
    if (mutating.length) {
      parts.push(
        `When invoking a MUTATING tool (${mutating.join(", ")}) you MUST first summarize the planned action in plain text and ask the user for explicit confirmation. NEVER invoke a mutating tool on the first turn without confirmation.`
      );
    }

    return parts.join("\n");
  }

  private async fetchLlmsContext(): Promise<string> {
    const now = this.deps.now();
    if (this.llmsCache && now - this.llmsCache.fetchedAt < LLMS_TXT_TTL_MS) {
      return this.llmsCache.content;
    }
    if (this.llmsInflight) return this.llmsInflight;

    this.llmsInflight = (async () => {
      try {
        const response = await this.deps.fetch(LLMS_TXT_URL);
        if (!response.ok) throw new Error(`status ${response.status}`);
        const raw = await response.text();
        const stripped = stripMdFromDocsUrls(raw);
        const trimmed =
          stripped.length > LLMS_TXT_MAX_BYTES
            ? stripped.slice(0, LLMS_TXT_MAX_BYTES) + "\n\n...(truncated)..."
            : stripped;
        this.llmsCache = { fetchedAt: now, content: trimmed };
        return trimmed;
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        this.deps.logger.warn(`nexus: failed to fetch llms.txt: ${message}`);
        return this.llmsCache?.content ?? "";
      } finally {
        this.llmsInflight = null;
      }
    })();
    return this.llmsInflight;
  }

  private async describeInstalledPackages(): Promise<string> {
    const now = this.deps.now();
    if (this.packageListCache && now - this.packageListCache.fetchedAt < PACKAGE_LIST_TTL_MS) {
      return this.packageListCache.content;
    }

    let pkgs: InstalledPackageData[];
    try {
      pkgs = await this.deps.listPackages();
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      this.deps.logger.warn(`nexus: listPackages failed: ${message}`);
      return "(unable to read the installed-package list right now)";
    }

    if (pkgs.length === 0) {
      this.packageListCache = { fetchedAt: now, content: "(no packages installed)" };
      return this.packageListCache.content;
    }

    const sorted = [...pkgs].sort((a, b) => {
      if (a.isCore !== b.isCore) return a.isCore ? 1 : -1;
      return a.dnpName.localeCompare(b.dnpName);
    });

    const content = sorted
      .map((pkg) => {
        const state = summarizeContainerState(pkg.containers || []);
        const tags: string[] = [];
        if (pkg.isCore) tags.push("core");
        if (pkg.chain) tags.push(`chain:${pkg.chain}`);
        const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
        const version = pkg.version ? `v${pkg.version}` : "v?";
        return `- ${pkg.dnpName} (${version}, ${state})${tagStr}`;
      })
      .join("\n");

    this.packageListCache = { fetchedAt: now, content };
    return content;
  }
}

interface DappmanagerPageContext {
  path?: unknown;
  search?: unknown;
  hash?: unknown;
  title?: unknown;
}

function describePageContext(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const ctx = raw as DappmanagerPageContext;
  const path = typeof ctx.path === "string" ? ctx.path : "";
  if (!path) return null;
  const search = typeof ctx.search === "string" ? ctx.search : "";
  const hash = typeof ctx.hash === "string" ? ctx.hash : "";
  const title = typeof ctx.title === "string" ? ctx.title.trim() : "";

  const fullPath = path + search + hash;
  const lines = ["================ USER'S CURRENT PAGE (admin UI) ================", `- Path: ${fullPath}`];
  if (title) lines.push(`- Title: ${title}`);
  lines.push(
    'When the user asks vague things like "what is this" or "how do I use this page", assume they mean the page above. Otherwise treat it as ambient context - do not volunteer it unless relevant.',
    "================ END USER'S CURRENT PAGE ================",
    ""
  );
  return lines.join("\n");
}

function summarizeContainerState(containers: PackageContainer[]): string {
  if (!containers.length) return "no-containers";
  const states = containers.map((container) => container.state).filter(Boolean);
  if (states.length === 0) return "unknown";
  if (states.every((state) => state === "running")) return "running";
  return Array.from(new Set(states)).join("/");
}
