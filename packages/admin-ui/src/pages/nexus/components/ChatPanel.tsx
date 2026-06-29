import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import Select from "components/Select";
import NexusMarkdown from "./NexusMarkdown";
import Dropdown from "react-bootstrap/Dropdown";
import { MdChatBubbleOutline, MdHistory } from "react-icons/md";
import { FiTrash2, FiPlus, FiKey, FiSend, FiSquare, FiEye, FiEyeOff, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { nexusExternalUrl } from "../data";
import "./nexus.scss";
import {
  ChatError,
  ChatHistorySummary,
  ChatMessage,
  NexusModel,
  NexusStatus,
  clearChatHistory,
  clearNexusApiKey,
  deleteConversation,
  getNexusStatus,
  listChatHistory,
  listNexusModels,
  loadConversation,
  saveConversation,
  setNexusApiKey,
  smoothStream,
  streamChat,
  submitChatConfirmation
} from "../api";

const SELECTED_MODEL_STORAGE_KEY = "nexus-chat-selected-model";

const SUGGESTIONS = [
  "List the packages installed on this DAppNode and explain what each does",
  "Suggest packages I should install for solo Ethereum staking",
  "Explain MEV-Boost in the DAppNode context",
  "How do I back up and restore a package?"
];

interface PendingConfirmation {
  id: string;
  tool: string;
  displayName: string;
  args: unknown;
}

export type ChatPanelVariant = "page" | "floating";

export interface ChatPanelProps {
  variant?: ChatPanelVariant;
  onOpenFullScreen?: () => void;
  onOpenFloating?: () => void;
}

interface NexusChatContextValue {
  initialize: () => Promise<void>;
  status: NexusStatus | null;
  statusError: string | null;
  models: NexusModel[];
  modelsError: string | null;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  messages: ChatMessage[];
  isRunning: boolean;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  streamError: string | null;
  pendingConfirm: PendingConfirmation | null;
  conversationId: string | null;
  historyList: ChatHistorySummary[];
  showKeyEditor: boolean;
  setShowKeyEditor: React.Dispatch<React.SetStateAction<boolean>>;
  send: (text: string) => Promise<void>;
  cancel: () => void;
  respondToConfirmation: (confirmation: PendingConfirmation, decision: "approve" | "deny") => Promise<void>;
  startNewChat: () => void;
  openHistoryConversation: (id: string) => Promise<void>;
  removeHistoryConversation: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  applyStatus: (s: NexusStatus) => Promise<void>;
  isFloatingOpen: boolean;
  hasFloatingOpened: boolean;
  openFloatingChat: () => void;
  closeFloatingChat: () => void;
}

const NexusChatContext = createContext<NexusChatContextValue | null>(null);

export function NexusChatProvider({ children }: { children: React.ReactNode }) {
  const value = useNexusChatState();
  return <NexusChatContext.Provider value={value}>{children}</NexusChatContext.Provider>;
}

export function useNexusChat() {
  const context = useContext(NexusChatContext);
  if (!context) throw new Error("useNexusChat must be used within NexusChatProvider");
  return context;
}

function useNexusChatState(): NexusChatContextValue {
  const [status, setStatus] = useState<NexusStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [models, setModels] = useState<NexusModel[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [draft, setDraft] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<ChatHistorySummary[]>([]);
  const [showKeyEditor, setShowKeyEditor] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [hasFloatingOpened, setHasFloatingOpened] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const lastSavedRef = useRef<string>("");
  const initializedRef = useRef(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadModels = useCallback(async (s: NexusStatus) => {
    setModelsError(null);
    try {
      const list = await listNexusModels();
      setModels(list);
      const remembered = readRememberedModel();
      setSelectedModel((prev) => {
        const preferred = [prev, remembered, s.defaultModel].find((id) => id && list.some((m) => m.id === id));
        return preferred || list[0]?.id || "";
      });
    } catch (err) {
      setModelsError((err as Error).message);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const list = await listChatHistory();
      setHistoryList(list);
    } catch {
      /* non-fatal */
    }
  }, []);

  const initialize = useCallback(async () => {
    if (initializedRef.current || initializingRef.current) return;

    initializingRef.current = true;
    setStatusError(null);
    try {
      const s = await getNexusStatus();
      setStatus(s);
      if (s.configured) await loadModels(s);
      await refreshHistory();
      initializedRef.current = true;
    } catch (err) {
      setStatusError((err as Error).message);
    } finally {
      initializingRef.current = false;
    }
  }, [loadModels, refreshHistory]);

  const applyStatus = useCallback(
    async (s: NexusStatus) => {
      setStatusError(null);
      setStatus(s);
      if (s.configured) {
        await loadModels(s);
      } else {
        setModels([]);
        setSelectedModel("");
      }
    },
    [loadModels]
  );

  useEffect(() => {
    if (selectedModel) writeRememberedModel(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (isRunning || !conversationId || messages.length < 2) return;
    const signature = JSON.stringify(messages);
    if (signature === lastSavedRef.current) return;
    lastSavedRef.current = signature;
    saveConversation(conversationId, messages)
      .then(() => refreshHistory())
      .catch(() => {
        /* ignore */
      });
  }, [isRunning, conversationId, messages, refreshHistory]);

  const send = async (text: string) => {
    if (!text.trim() || isRunning || !status?.configured || !selectedModel) return;

    if (!conversationId) {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      setConversationId(id);
    }

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const placeholder: ChatMessage = { role: "assistant", content: "" };
    const history = [...messages, userMsg];
    setMessages([...history, placeholder]);
    setDraft("");
    setStreamError(null);
    setIsRunning(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const source = streamChat({
        model: selectedModel,
        messages: history,
        signal: ac.signal
      });
      for await (const event of smoothStream(source, ac.signal)) {
        if (event.type === "content") {
          setMessages((prev) => {
            const next = prev.slice();
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + event.delta };
            return next;
          });
        } else if (event.type === "confirm_required") {
          setPendingConfirm({
            id: event.id,
            tool: event.tool,
            displayName: event.displayName,
            args: event.args
          });
        } else if (event.type === "confirm_resolved") {
          setPendingConfirm((current) => (current?.id === event.id ? null : current));
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        // user-initiated cancel — keep partial text
      } else if (err instanceof ChatError) {
        setStreamError(err.message);
        if (err.status) setStatus(err.status);
        setMessages((prev) => (prev[prev.length - 1]?.content ? prev : prev.slice(0, -1)));
      } else {
        setStreamError((err as Error).message || "Unknown error");
        setMessages((prev) => (prev[prev.length - 1]?.content ? prev : prev.slice(0, -1)));
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
      setPendingConfirm(null);
    }
  };

  const cancel = () => abortRef.current?.abort();

  const respondToConfirmation = async (confirmation: PendingConfirmation, decision: "approve" | "deny") => {
    setPendingConfirm(null);
    try {
      await submitChatConfirmation(confirmation.id, decision);
    } catch (err) {
      setStreamError((err as Error).message);
    }
  };

  const startNewChat = () => {
    if (isRunning) abortRef.current?.abort();
    if (messages.length === 0 && !conversationId) return;
    setMessages([]);
    setConversationId(null);
    setDraft("");
    setStreamError(null);
    setPendingConfirm(null);
    lastSavedRef.current = "";
  };

  const openHistoryConversation = async (id: string) => {
    if (id === conversationId) return;
    if (isRunning) abortRef.current?.abort();
    setStreamError(null);
    setPendingConfirm(null);
    try {
      const conv = await loadConversation(id);
      const restored = conv.messages.filter((m) => m.content || m.role === "user");
      setMessages(restored);
      setConversationId(id);
      lastSavedRef.current = JSON.stringify(restored);
    } catch (err) {
      setStreamError((err as Error).message);
    }
  };

  const removeHistoryConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setHistoryList((prev) => prev.filter((h) => h.id !== id));
      if (id === conversationId) {
        setMessages([]);
        setConversationId(null);
        lastSavedRef.current = "";
      }
    } catch (err) {
      setStreamError((err as Error).message);
    }
  };

  const clearHistory = async () => {
    if (isRunning) abortRef.current?.abort();
    try {
      await clearChatHistory();
      setHistoryList([]);
      setMessages([]);
      setConversationId(null);
      setStreamError(null);
      setPendingConfirm(null);
      lastSavedRef.current = "";
    } catch (err) {
      setStreamError((err as Error).message);
    }
  };

  const openFloatingChat = useCallback(() => {
    setHasFloatingOpened(true);
    setIsFloatingOpen(true);
  }, []);

  const closeFloatingChat = useCallback(() => setIsFloatingOpen(false), []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return {
    initialize,
    status,
    statusError,
    models,
    modelsError,
    selectedModel,
    setSelectedModel,
    messages,
    isRunning,
    draft,
    setDraft,
    streamError,
    pendingConfirm,
    conversationId,
    historyList,
    showKeyEditor,
    setShowKeyEditor,
    send,
    cancel,
    respondToConfirmation,
    startNewChat,
    openHistoryConversation,
    removeHistoryConversation,
    clearHistory,
    applyStatus,
    isFloatingOpen,
    hasFloatingOpened,
    openFloatingChat,
    closeFloatingChat
  };
}

export function ChatPanel({ variant = "page", onOpenFullScreen, onOpenFloating }: ChatPanelProps) {
  const {
    initialize,
    status,
    statusError,
    models,
    modelsError,
    selectedModel,
    setSelectedModel,
    messages,
    isRunning,
    draft,
    setDraft,
    streamError,
    pendingConfirm,
    conversationId,
    historyList,
    showKeyEditor,
    setShowKeyEditor,
    send,
    cancel,
    respondToConfirmation,
    startNewChat,
    openHistoryConversation,
    removeHistoryConversation,
    clearHistory,
    applyStatus
  } = useNexusChat();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!status && !statusError) {
    return (
      <div className="nexus-chat-loading">
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
        <p className="mt-3 mb-0">Connecting to Nexus…</p>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="nexus-chat-loading">
        <strong>Couldn't reach DAppNode</strong>
        <p className="mt-2 mb-0">{statusError}</p>
      </div>
    );
  }

  if (!status) return null;

  const confirmClearHistory = () => {
    if (historyList.length === 0) return;
    confirm({
      title: "Clear chat history?",
      text: "This will delete all saved Nexus conversations from this DAppNode.",
      label: "Clear history",
      variant: "danger",
      onClick: () => {
        void clearHistory();
      }
    });
  };

  const chatCard = (
    <div className={`nexus-chat-card nexus-chat-card-${variant}`}>
      <ChatHeader
        status={status}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        modelsError={modelsError}
        historyList={historyList}
        activeConversationId={conversationId}
        onNewChat={startNewChat}
        onOpenConversation={openHistoryConversation}
        onDeleteConversation={removeHistoryConversation}
        onClearHistory={confirmClearHistory}
        onManageKey={() => setShowKeyEditor(true)}
        onOpenFullScreen={onOpenFullScreen}
        onOpenFloating={onOpenFloating}
      />

      {showKeyEditor && (
        <ApiKeyEditor
          status={status}
          onClose={() => setShowKeyEditor(false)}
          onSave={async (key) => {
            const next = await setNexusApiKey(key);
            await applyStatus(next);
            setShowKeyEditor(false);
          }}
          onClear={async () => {
            const next = await clearNexusApiKey();
            await applyStatus(next);
            setShowKeyEditor(false);
          }}
        />
      )}

      <div className="nexus-chat-body">
        {messages.length === 0 ? (
          <EmptyState
            configured={status.configured}
            onPick={(prompt) => send(prompt)}
            disabled={!status.configured || !selectedModel}
          />
        ) : (
          <Thread
            messages={messages}
            isRunning={isRunning}
            pendingConfirm={pendingConfirm}
            onConfirmation={respondToConfirmation}
          />
        )}
      </div>

      {!status.configured ? (
        <NotConfigured onConfigure={() => setShowKeyEditor(true)} />
      ) : (
        <Composer
          draft={draft}
          onDraftChange={setDraft}
          onSend={() => send(draft)}
          onCancel={cancel}
          isRunning={isRunning}
          error={streamError}
          disabled={!selectedModel}
        />
      )}
    </div>
  );

  if (variant !== "page") return chatCard;

  return (
    <div className="nexus-chat-shell nexus-chat-shell-page">
      <HistorySidebar
        historyList={historyList}
        activeConversationId={conversationId}
        onNewChat={startNewChat}
        onOpenConversation={openHistoryConversation}
        onDeleteConversation={removeHistoryConversation}
        onClearHistory={confirmClearHistory}
      />
      {chatCard}
    </div>
  );
}

function readRememberedModel(): string {
  try {
    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function writeRememberedModel(id: string): void {
  try {
    localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}

/* ── Header ────────────────────────────────────────────────────────── */

function ChatHeader({
  status,
  models,
  selectedModel,
  onSelectModel,
  modelsError,
  historyList,
  activeConversationId,
  onNewChat,
  onOpenConversation,
  onDeleteConversation,
  onClearHistory,
  onManageKey,
  onOpenFullScreen,
  onOpenFloating
}: {
  status: NexusStatus;
  models: NexusModel[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  modelsError: string | null;
  historyList: ChatHistorySummary[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onOpenConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearHistory: () => void;
  onManageKey: () => void;
  onOpenFullScreen?: () => void;
  onOpenFloating?: () => void;
}) {
  const modelIds = useMemo(() => {
    return [...models].sort(sortModelCompare).map((m) => m.id);
  }, [models]);

  const statusLabel = status.configured ? (
    <span className="nexus-status-dot online" />
  ) : (
    <span className="nexus-status-dot offline" />
  );

  return (
    <div className="nexus-chat-header">
      <div className="nexus-chat-header-left">
        <div className="nexus-chat-avatar">
          <MdChatBubbleOutline />
        </div>
        <div>
          <div className="nexus-chat-title">
            Nexus chat
            {statusLabel}
          </div>
          <div className="nexus-chat-subtitle">
            {status.configured
              ? `${modelIds.length} model${modelIds.length === 1 ? "" : "s"} available`
              : "Not configured"}
          </div>
        </div>
      </div>

      <div className="nexus-chat-header-right">
        {modelsError ? (
          <small className="text-danger me-3">{modelsError}</small>
        ) : status.configured ? (
          <div className="nexus-model-picker">
            <Select value={selectedModel} options={modelIds} onValueChange={onSelectModel} />
          </div>
        ) : null}

        {onOpenFullScreen && (
          <button
            type="button"
            className="nexus-icon-button"
            onClick={onOpenFullScreen}
            title="Open full screen"
            aria-label="Open full screen"
          >
            <FiMaximize2 />
          </button>
        )}

        {onOpenFloating && (
          <button
            type="button"
            className="nexus-icon-button"
            onClick={onOpenFloating}
            title="Open as bubble"
            aria-label="Open as bubble"
          >
            <FiMinimize2 />
          </button>
        )}

        <button type="button" className="nexus-icon-button" onClick={onNewChat} title="New chat">
          <FiPlus />
        </button>

        <Dropdown align="end" className="nexus-history-dropdown">
          <Dropdown.Toggle
            as="button"
            type="button"
            className="nexus-icon-button"
            id="nexus-history-toggle"
            title="Past conversations"
          >
            <MdHistory />
          </Dropdown.Toggle>
          <Dropdown.Menu className="nexus-history-menu">
            <Dropdown.Header className="nexus-history-header">
              Past conversations
              <span className="nexus-history-header-actions">
                <span className="nexus-history-count">{historyList.length}</span>
                <button
                  type="button"
                  className="nexus-history-clear"
                  onClick={onClearHistory}
                  disabled={historyList.length === 0}
                  title="Clear chat history"
                  aria-label="Clear chat history"
                >
                  <FiTrash2 />
                </button>
              </span>
            </Dropdown.Header>
            {historyList.length === 0 ? (
              <Dropdown.ItemText className="nexus-history-empty">No saved chats yet.</Dropdown.ItemText>
            ) : (
              <HistoryItems
                historyList={historyList}
                activeConversationId={activeConversationId}
                onOpenConversation={onOpenConversation}
                onDeleteConversation={onDeleteConversation}
              />
            )}
          </Dropdown.Menu>
        </Dropdown>

        <button
          type="button"
          className="nexus-icon-button"
          onClick={onManageKey}
          title={status.configured ? "Manage API key" : "Set API key"}
        >
          <FiKey />
        </button>
      </div>
    </div>
  );
}

function HistorySidebar({
  historyList,
  activeConversationId,
  onNewChat,
  onOpenConversation,
  onDeleteConversation,
  onClearHistory
}: {
  historyList: ChatHistorySummary[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onOpenConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearHistory: () => void;
}) {
  return (
    <aside className="nexus-history-sidebar" aria-label="Past conversations">
      <div className="nexus-history-sidebar-header">
        <div>
          <div className="nexus-history-sidebar-title">
            <MdHistory />
            <span>Past conversations</span>
          </div>
          <div className="nexus-history-sidebar-subtitle">
            {historyList.length} saved chat{historyList.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="nexus-history-sidebar-actions">
          <button
            type="button"
            className="nexus-icon-button"
            onClick={onClearHistory}
            disabled={historyList.length === 0}
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            <FiTrash2 />
          </button>
          <button
            type="button"
            className="nexus-icon-button"
            onClick={onNewChat}
            title="New chat"
            aria-label="New chat"
          >
            <FiPlus />
          </button>
        </div>
      </div>

      <div className="nexus-history-sidebar-list">
        {historyList.length === 0 ? (
          <div className="nexus-history-empty">No saved chats yet.</div>
        ) : (
          <HistoryItems
            historyList={historyList}
            activeConversationId={activeConversationId}
            onOpenConversation={onOpenConversation}
            onDeleteConversation={onDeleteConversation}
          />
        )}
      </div>
    </aside>
  );
}

function HistoryItems({
  historyList,
  activeConversationId,
  onOpenConversation,
  onDeleteConversation
}: {
  historyList: ChatHistorySummary[];
  activeConversationId: string | null;
  onOpenConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}) {
  return (
    <>
      {historyList.map((h) => (
        <div
          key={h.id}
          role="button"
          tabIndex={0}
          className={`nexus-history-item ${h.id === activeConversationId ? "active" : ""}`}
          onClick={() => onOpenConversation(h.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenConversation(h.id);
            }
          }}
        >
          <div className="nexus-history-main">
            <span className="nexus-history-title">{h.title}</span>
            <small className="nexus-history-meta">
              {formatRelative(h.updatedAt)} · {h.messageCount} msg
            </small>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(h.id);
            }}
            className="nexus-history-delete"
            title="Delete conversation"
            aria-label={`Delete ${h.title}`}
          >
            <FiTrash2 />
          </button>
        </div>
      ))}
    </>
  );
}

function sortModelCompare(a: NexusModel, b: NexusModel): number {
  const aRank = a.kind === "router" ? 0 : 1;
  const bRank = b.kind === "router" ? 0 : 1;
  if (aRank !== bRank) return aRank - bRank;
  return a.id.localeCompare(b.id);
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/* ── Empty state ───────────────────────────────────────────────────── */

function EmptyState({
  configured,
  onPick,
  disabled
}: {
  configured: boolean;
  onPick: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="nexus-empty-state">
      <div className="nexus-empty-hero">
        <div className="nexus-empty-icon">
          <MdChatBubbleOutline />
        </div>
        <h5>Talk to a private model</h5>
        <p>
          {configured
            ? "Talks to Nexus through this Dappnode, with the official docs and your installed-package list as context."
            : "Nexus chat hasn't been configured on this Dappnode yet."}
        </p>
      </div>
      {configured && (
        <div className="nexus-suggestions">
          {SUGGESTIONS.map((prompt) => (
            <button key={prompt} disabled={disabled} onClick={() => onPick(prompt)} className="nexus-suggestion">
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Messages ──────────────────────────────────────────────────────── */

function Thread({
  messages,
  isRunning,
  pendingConfirm,
  onConfirmation
}: {
  messages: ChatMessage[];
  isRunning: boolean;
  pendingConfirm: PendingConfirmation | null;
  onConfirmation: (confirmation: PendingConfirmation, decision: "approve" | "deny") => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef(0);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const shouldStick = isNearBottom();
    const newHeight = el.scrollHeight;
    const grew = newHeight > lastHeightRef.current;
    lastHeightRef.current = newHeight;

    if (shouldStick) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: grew ? "smooth" : "auto" });
      });
    }
  }, [messages, pendingConfirm, isNearBottom]);

  return (
    <div ref={scrollRef} className="nexus-thread">
      {messages.map((msg, idx) => {
        const isLast = idx === messages.length - 1;
        return msg.role === "user" ? (
          <UserBubble key={idx} text={msg.content} />
        ) : (
          <AssistantBubble key={idx} text={msg.content} isRunning={isRunning && isLast && !pendingConfirm} />
        );
      })}
      {pendingConfirm && (
        <ConfirmationCard
          confirmation={pendingConfirm}
          onDecision={(decision) => onConfirmation(pendingConfirm, decision)}
        />
      )}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="nexus-message nexus-message-user">
      <div className="nexus-bubble nexus-bubble-user">{text}</div>
    </div>
  );
}

function AssistantBubble({ text, isRunning }: { text: string; isRunning: boolean }) {
  return (
    <div className="nexus-message nexus-message-assistant">
      <div className="nexus-avatar-assistant">
        <MdChatBubbleOutline />
      </div>
      <div className="nexus-bubble nexus-bubble-assistant">
        {isRunning && !text ? <span className="nexus-typing">●●●</span> : <NexusMarkdown source={text || ""} />}
      </div>
    </div>
  );
}

function ConfirmationCard({
  confirmation,
  onDecision
}: {
  confirmation: PendingConfirmation;
  onDecision: (decision: "approve" | "deny") => void;
}) {
  const formattedArgs = useMemo(() => {
    if (!confirmation.args || typeof confirmation.args !== "object") {
      return JSON.stringify(confirmation.args ?? {});
    }
    return JSON.stringify(confirmation.args, null, 2);
  }, [confirmation.args]);

  return (
    <div className="nexus-confirmation-card">
      <div className="nexus-confirmation-inner">
        <div className="nexus-confirmation-title">
          <span>Confirm tool call</span>
          <span className="nexus-mutating-badge">mutating</span>
        </div>
        <p>
          The assistant wants to run <strong>{confirmation.displayName}</strong> ({confirmation.tool}).
        </p>
        <pre className="nexus-tool-args">{formattedArgs}</pre>
        <div className="nexus-confirmation-actions">
          <Button variant="outline-secondary" onClick={() => onDecision("deny")}>
            Deny
          </Button>
          <Button variant="dappnode" onClick={() => onDecision("approve")}>
            Approve &amp; run
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Composer ──────────────────────────────────────────────────────── */

function Composer({
  draft,
  onDraftChange,
  onSend,
  onCancel,
  isRunning,
  error,
  disabled
}: {
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isRunning: boolean;
  error: string | null;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [draft, autoResize]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="nexus-composer">
      {error && <div className="nexus-composer-error">{error}</div>}
      <div className="nexus-composer-row">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            onDraftChange(e.target.value);
            autoResize();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Send a message…"
          className="nexus-composer-input"
          disabled={disabled}
        />
        {isRunning ? (
          <button className="nexus-send-button nexus-stop-button" onClick={onCancel} title="Stop generating">
            <FiSquare />
          </button>
        ) : (
          <button
            className="nexus-send-button"
            onClick={onSend}
            disabled={disabled || !draft.trim()}
            title="Send message"
          >
            <FiSend />
          </button>
        )}
      </div>
      <small className="nexus-composer-hint">Enter to send · Shift+Enter for newline</small>
    </div>
  );
}

/* ── CTAs ──────────────────────────────────────────────────────────── */

function NotConfigured({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="nexus-not-configured">
      <div className="nexus-not-configured-icon">
        <FiKey />
      </div>
      <div className="nexus-not-configured-text">
        <strong>Nexus chat is not configured</strong>
        <p>Paste a Nexus API key to get started — generate one in the Nexus user portal.</p>
        <div className="nexus-not-configured-actions">
          <Button variant="dappnode" onClick={onConfigure}>
            Add API key
          </Button>
          <Button variant="outline-secondary" onClick={() => window.open(nexusExternalUrl, "_blank")}>
            Open Nexus
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── API-key editor ────────────────────────────────────────────────── */

function ApiKeyEditor({
  status,
  onSave,
  onClear,
  onClose
}: {
  status: NexusStatus;
  onSave: (key: string) => Promise<void>;
  onClear: () => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const key = value.trim();
    if (!key || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(key);
    } catch (err) {
      setError((err as Error).message || "Failed to save the API key");
      setBusy(false);
    }
  };

  const clear = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onClear();
    } catch (err) {
      setError((err as Error).message || "Failed to clear the API key");
      setBusy(false);
    }
  };

  return (
    <div className="nexus-key-editor-overlay" onClick={onClose}>
      <div className="nexus-key-editor-card" onClick={(e) => e.stopPropagation()}>
        <div className="nexus-key-editor-header">
          <h5>{status.configured ? "Update Nexus API key" : "Set Nexus API key"}</h5>
          <button type="button" className="nexus-key-editor-close" onClick={onClose} disabled={busy}>
            ×
          </button>
        </div>

        <p className="nexus-key-editor-text">
          The key is stored on this DAppNode and used to talk to Nexus.{" "}
          <a href={nexusExternalUrl} target="_blank" rel="noopener noreferrer">
            Generate one in the Nexus user portal
          </a>
          .
        </p>

        <div className="nexus-key-editor-input-group">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="sk-…"
            autoFocus
            autoComplete="off"
            disabled={busy}
            className="form-control nexus-key-editor-input"
          />
          <button
            type="button"
            className="nexus-key-editor-toggle"
            onClick={() => setShow((s) => !s)}
            disabled={busy}
            title={show ? "Hide key" : "Show key"}
          >
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {error && <div className="nexus-key-editor-error">{error}</div>}

        <div className="nexus-key-editor-actions">
          <div>
            {status.keySource === "db" && (
              <Button variant="outline-danger" onClick={clear} disabled={busy}>
                Remove key
              </Button>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="dappnode" onClick={submit} disabled={busy || !value.trim()}>
              {busy ? "Saving…" : status.configured ? "Save" : "Save & connect"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
