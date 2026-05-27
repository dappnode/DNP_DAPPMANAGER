import { dbCache } from "./dbFactory.js";

/**
 * Persisted chat conversations. Stored in dbCache (non-critical — can be
 * wiped by the user) so conversations survive page reloads on the same
 * DAppNode. The proxy caps the registry at MAX_HISTORY entries.
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

export const nexusChatHistory = dbCache.indexedByKey<NexusStoredConversation, string>({
  rootKey: NEXUS_CHAT_HISTORY,
  getKey: (id) => id
});
