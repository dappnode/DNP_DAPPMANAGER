import type { InstalledPackageData } from "@dappnode/types";

export type FetchLike = typeof fetch;

export interface LoggerLike {
  info(message: string): void;
  warn(message: string): void;
}

export interface NexusStoredChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NexusStoredConversation {
  id: string;
  title: string;
  messages: NexusStoredChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface NexusHistoryStore {
  getAll(): Record<string, NexusStoredConversation>;
  get(id: string): NexusStoredConversation | null | undefined;
  set(id: string, value: NexusStoredConversation): void;
  remove(id: string): void;
}

export interface NexusApiKeyStore {
  get(): string;
  set(value: string): void;
  getSource?(): "manual" | "nexus";
  getAccountLabel?(): string | null;
}

export interface NexusStatus {
  configured: boolean;
  gatewayUrl: string;
  defaultModel: string;
  keySource: "manual" | "nexus" | "none";
  accountLabel: string | null;
  /** True when traffic is routed through the attested local proxy. */
  privateMode: boolean;
  /** Where the operator can inspect the attestation evidence. */
  verificationUrl: string;
}

export interface GatewayModel {
  id: string;
  display_name?: string;
  description?: string;
  kind?: string;
  endpoints?: string[];
  features?: string[];
  context_size?: number;
  max_output_tokens?: number;
  input_price_per_1m_tokens_cents?: number;
  output_price_per_1m_tokens_cents?: number;
}

export interface HistorySummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface NexusToolSummary {
  name: string;
  displayName: string;
  mutating?: boolean;
}

export interface ToolDispatchResult {
  ok: boolean;
  output?: unknown;
  error?: string;
  mutating?: boolean;
}

export type ConfirmationDecision = "approve" | "deny";

export interface ConfirmationResult {
  decision: ConfirmationDecision;
  reason?: string;
}

export interface CreatedConfirmation {
  id: string;
  promise: Promise<ConfirmationResult>;
}

export interface NexusMcpAdapter {
  toolList: NexusToolSummary[];
  getOpenAITools(): OpenAITool[];
  dispatchTool(name: string, rawArgs: unknown): Promise<ToolDispatchResult>;
  createPendingConfirmation(tool: string, args: unknown, signal?: AbortSignal): CreatedConfirmation;
  resolveConfirmation(id: string, decision: ConfirmationDecision, reason?: string): boolean;
}

export interface NexusStreamWriter {
  readonly writableEnded: boolean;
  status(code: number): void;
  setHeader(name: string, value: string): void;
  flushHeaders?: () => void;
  write(chunk: string): void;
}

export interface NexusRawResponse {
  statusCode: number;
  contentType: string;
  body: string;
}

export interface NexusApiDeps {
  apiKeyStore: NexusApiKeyStore;
  historyStore: NexusHistoryStore;
  listPackages(): Promise<InstalledPackageData[]>;
  logger: LoggerLike;
  mcp: NexusMcpAdapter;
  fetch?: FetchLike;
  now?: () => number;
  getGatewayUrl?: () => string | undefined;
  privateModeStore?: { get: () => boolean; set: (value: boolean) => void };
  getDefaultModel?: () => string | undefined;
  startDocsWarmup?: () => void;
}

export type NexusServiceDeps = NexusApiDeps;
