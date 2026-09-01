import { dbMain, dbNexus } from "./dbFactory.js";

/**
 * Persisted chat conversations. Stored in dbNexus so conversations survive
 * page reloads on the same DAppNode without living in the generic cache DB.
 * The proxy caps the registry at MAX_HISTORY entries.
 */
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

const NEXUS_CHAT_HISTORY = "nexus-chat-history";

export const nexusChatHistory = dbNexus.indexedByKey<NexusStoredConversation, string>({
  rootKey: NEXUS_CHAT_HISTORY,
  getKey: (id) => id
});

const nexusApiKeyDbKey = "nexus-api-key";
const nexusManagedApiKeyDbKey = "nexus-managed-api-key";

export interface NexusManagedApiKey {
  id: string;
  accountSub: string;
  accountLabel: string | null;
}

export const nexusApiKey = dbMain.staticKey<string>(nexusApiKeyDbKey, "");
export const nexusManagedApiKey = dbMain.staticKey<NexusManagedApiKey | null>(nexusManagedApiKeyDbKey, null);

const nexusPrivateModeDbKey = "nexus-private-mode";

/**
 * Whether Nexus traffic is routed through the attested nexus-local-proxy on
 * this DAppNode instead of straight to the gateway. Off by default: the proxy
 * fails closed, so opting in is a deliberate choice.
 */
export const nexusPrivateMode = dbMain.staticKey<boolean>(nexusPrivateModeDbKey, false);
