import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  ExternalLink,
  History,
  MessageSquarePlus,
  Sparkles,
  Square,
  KeyRound,
  ShieldAlert,
  Trash2,
  X
} from "lucide-react";
import { Button } from "components/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "components/primitives/dropdown-menu";
import { TypographyMuted } from "components/primitives/typography";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/primitives/select";
import { Alert, AlertTitle } from "components/primitives/alert";
import { Spinner } from "components/primitives/spinner";
import { cn } from "lib/utils";
import { nexusExternalUrl } from "../data";
import { Markdown } from "./Markdown";
import {
  ChatError,
  ChatHistorySummary,
  ChatMessage,
  ChatPageContext,
  NexusModel,
  NexusStatus,
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
} from "./api";

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

/**
 * `page` (default) renders the panel sized for the dedicated /ai/nexus route.
 * `floating` lets the parent (e.g. the bottom-right launcher) control the
 * outer dimensions, drops the outer ring and lets the close button render in
 * the header.
 */
export type ChatPanelVariant = "page" | "floating";

export interface ChatPanelProps {
  variant?: ChatPanelVariant;
  /**
   * Sampled lazily on each send — pass a function so the panel always
   * reads the current URL when the user actually hits Enter, even if they
   * navigated while the chat was open.
   */
  getPageContext?: () => ChatPageContext | undefined;
  onRequestClose?: () => void;
}

export function ChatPanel({ variant = "page", getPageContext, onRequestClose }: ChatPanelProps = {}) {
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
  const [keyEditorOpen, setKeyEditorOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Mirror of `messages` so the post-stream save can read the final state
  // without races with React's state batching.
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  // Signature of the most recently saved conversation — used to skip saving
  // unchanged state (e.g. immediately after loading a conversation).
  const lastSavedRef = useRef<string>("");

  // Loads the chat-capable models for a configured DAppNode and selects an
  // initial model: last-used (if still available) → env default (if listed) →
  // first listed. Shared by the mount effect and the post-key-save flow.
  const loadModels = useCallback(async (s: NexusStatus) => {
    setModelsError(null);
    try {
      const list = await listNexusModels();
      setModels(list);
      const remembered = readRememberedModel();
      setSelectedModel((prev) => {
        // Keep the current pick if it's still offered; otherwise fall back to
        // last-used → env default → first listed.
        const preferred = [prev, remembered, s.defaultModel].find(
          (id) => id && list.some((m) => m.id === id)
        );
        return preferred || list[0]?.id || "";
      });
    } catch (err) {
      setModelsError((err as Error).message);
    }
  }, []);

  // Fetch status + models on mount.
  useEffect(() => {
    let cancelled = false;
    getNexusStatus()
      .then(async (s) => {
        if (cancelled) return;
        setStatus(s);
        if (s.configured) await loadModels(s);
      })
      .catch((err: Error) => {
        if (!cancelled) setStatusError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [loadModels]);

  // Applies a status returned after the user sets/clears the key in-app, then
  // (re)loads the model list so the picker reflects the new credential.
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

  // Persist last-used model so the next visit lands on the same choice.
  useEffect(() => {
    if (selectedModel) writeRememberedModel(selectedModel);
  }, [selectedModel]);

  const refreshHistory = useCallback(async () => {
    try {
      const list = await listChatHistory();
      setHistoryList(list);
    } catch {
      /* non-fatal */
    }
  }, []);

  // Load the history list on mount so the dropdown is populated immediately.
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Auto-save the conversation server-side once a turn has settled (i.e.
  // we're no longer streaming) and the messages have actually changed since
  // the last save — so loading an existing conversation doesn't trigger a
  // pointless write.
  useEffect(() => {
    if (isRunning || !conversationId || messages.length < 2) return;
    const signature = JSON.stringify(messages);
    if (signature === lastSavedRef.current) return;
    lastSavedRef.current = signature;
    saveConversation(conversationId, messages)
      .then(() => refreshHistory())
      .catch(() => {
        /* ignore — will retry on the next settled turn */
      });
  }, [isRunning, conversationId, messages, refreshHistory]);

  const send = async (text: string) => {
    if (!text.trim() || isRunning || !status?.configured || !selectedModel) return;

    // Lazily assign a conversation id on the first message of a fresh chat.
    if (!conversationId) {
      const id = (typeof crypto !== "undefined" && crypto.randomUUID)
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
        signal: ac.signal,
        pageContext: getPageContext?.()
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
          // Server-side resolution arrived (e.g. via another tab, or the
          // user clicked Approve/Deny — either way we can clear the dialog).
          setPendingConfirm((current) => (current?.id === event.id ? null : current));
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        // user-initiated cancel — keep partial text
      } else if (err instanceof ChatError) {
        setStreamError(err.message);
        if (err.status) setStatus(err.status);
        // drop the placeholder if nothing came through
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

  const respondToConfirmation = async (
    confirmation: PendingConfirmation,
    decision: "approve" | "deny"
  ) => {
    // Optimistically dismiss; the server will also emit `confirm_resolved`.
    setPendingConfirm(null);
    try {
      await submitChatConfirmation(confirmation.id, decision);
    } catch (err) {
      // If the POST fails the server-side 5min timeout will catch it.
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
      // Drop any zero-text placeholders that might have slipped through.
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

  // Loading state
  if (!status && !statusError) {
    return (
      <Panel variant={variant}>
        <div className="tw:flex tw:flex-1 tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:p-12">
          <Spinner className="tw:size-5 tw:text-muted-foreground" />
          <TypographyMuted className="tw:text-sm">Connecting to Nexus…</TypographyMuted>
        </div>
      </Panel>
    );
  }

  if (statusError) {
    return (
      <Panel variant={variant}>
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:p-12 tw:text-center">
          <div>
            <div className="tw:text-sm tw:font-medium tw:text-foreground">Couldn't reach DAppNode</div>
            <TypographyMuted className="tw:mt-1 tw:text-xs">{statusError}</TypographyMuted>
          </div>
        </div>
      </Panel>
    );
  }

  if (!status) return null;

  return (
    <Panel variant={variant}>
      <Header
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
        onManageKey={() => setKeyEditorOpen((v) => !v)}
        onRequestClose={onRequestClose}
      />

      <div className="tw:relative tw:flex tw:flex-1 tw:flex-col tw:min-h-0">
        {keyEditorOpen && (
          <ApiKeyEditor
            status={status}
            onClose={() => setKeyEditorOpen(false)}
            onSave={async (key) => {
              const next = await setNexusApiKey(key);
              await applyStatus(next);
              setKeyEditorOpen(false);
            }}
            onClear={async () => {
              const next = await clearNexusApiKey();
              await applyStatus(next);
              setKeyEditorOpen(false);
            }}
          />
        )}
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
        <NotConfigured onConfigure={() => setKeyEditorOpen(true)} />
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
    </Panel>
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
    /* private mode — non-fatal */
  }
}

/* ── Layout shell ──────────────────────────────────────────────────── */

function Panel({
  variant,
  children
}: {
  variant: ChatPanelVariant;
  children: React.ReactNode;
}) {
  // Both variants render onto `bg-card` with `text-card-foreground` to match
  // the project's Card primitive. In floating mode the launcher provides the
  // outer ring/shadow/size; in page mode the panel owns those.
  const className =
    variant === "floating"
      ? "tw:flex tw:h-full tw:w-full tw:flex-col tw:overflow-hidden tw:bg-card tw:text-card-foreground"
      : "tw:flex tw:h-[calc(100svh-9rem)] tw:min-h-[540px] tw:w-full tw:flex-col tw:overflow-hidden tw:rounded-xl tw:bg-card tw:text-card-foreground tw:ring-1 tw:ring-foreground/10";
  return <div className={className}>{children}</div>;
}

/* ── Header ────────────────────────────────────────────────────────── */

function Header({
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
  onManageKey,
  onRequestClose
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
  onManageKey: () => void;
  onRequestClose?: () => void;
}) {
  return (
    <header className="tw:relative tw:flex tw:shrink-0 tw:items-center tw:gap-3 tw:border-b tw:border-border tw:px-5 tw:py-3">
      <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary/10 tw:text-primary">
        <Sparkles className="tw:size-4" />
      </div>
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-sm tw:font-semibold tw:text-foreground">Nexus chat</span>
          {status.configured && (
            <span
              className="tw:size-1.5 tw:rounded-full tw:bg-emerald-500"
              aria-label="online"
            />
          )}
        </div>
        <ModelPicker
          configured={status.configured}
          models={models}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          error={modelsError}
          fallback={status.defaultModel}
        />
      </div>
      <div className="tw:flex tw:items-center tw:gap-1.5">
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onNewChat}
          title="New chat"
          aria-label="New chat"
        >
          <MessageSquarePlus />
        </Button>
        <HistoryMenu
          history={historyList}
          activeId={activeConversationId}
          onOpen={onOpenConversation}
          onDelete={onDeleteConversation}
        />
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onManageKey}
          title={status.configured ? "Manage API key" : "Set API key"}
          aria-label={status.configured ? "Manage API key" : "Set API key"}
        >
          <KeyRound />
        </Button>
        {onRequestClose && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onRequestClose}
            title="Close chat"
            aria-label="Close chat"
          >
            <X />
          </Button>
        )}
      </div>
    </header>
  );
}

function HistoryMenu({
  history,
  activeId,
  onOpen,
  onDelete
}: {
  history: ChatHistorySummary[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Past conversations"
          title="Past conversations"
        >
          <History />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tw:w-72">
        <DropdownMenuLabel className="tw:flex tw:items-center tw:justify-between">
          <span>Past conversations</span>
          <span className="tw:font-mono tw:text-[10.5px] tw:text-muted-foreground">
            {history.length}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {history.length === 0 ? (
          <div className="tw:px-2 tw:py-2 tw:text-[12px] tw:text-muted-foreground">
            No saved chats yet.
          </div>
        ) : (
          history.map((h) => (
            <DropdownMenuItem
              key={h.id}
              onSelect={(e) => {
                e.preventDefault();
                onOpen(h.id);
              }}
              className={cn(
                "tw:flex tw:items-start tw:gap-2",
                h.id === activeId && "tw:bg-muted"
              )}
            >
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-[12.5px] tw:text-foreground">
                  {h.title}
                </div>
                <div className="tw:mt-0.5 tw:font-mono tw:text-[10.5px] tw:text-muted-foreground">
                  {formatRelative(h.updatedAt)} · {h.messageCount} msg
                </div>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Delete conversation"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(h.id);
                }}
                className="tw:size-6 tw:text-muted-foreground hover:tw:bg-destructive/10 hover:tw:text-destructive"
              >
                <Trash2 className="tw:size-3.5" />
              </Button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

function ModelPicker({
  configured,
  models,
  selectedModel,
  onSelectModel,
  error,
  fallback
}: {
  configured: boolean;
  models: NexusModel[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  error: string | null;
  fallback: string;
}) {
  const sorted = useMemo(() => sortModels(models), [models]);

  if (!configured) {
    return (
      <div className="tw:mt-0.5 tw:truncate tw:font-mono tw:text-[10.5px] tw:text-muted-foreground">
        not configured
      </div>
    );
  }

  if (error) {
    return (
      <div className="tw:mt-0.5 tw:truncate tw:font-mono tw:text-[10.5px] tw:text-destructive">
        {error}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="tw:mt-0.5 tw:truncate tw:font-mono tw:text-[10.5px] tw:text-muted-foreground">
        {selectedModel || fallback || "loading models…"}
      </div>
    );
  }

  const currentModel = sorted.find((m) => m.id === selectedModel);
  const currentLabel = currentModel
    ? `${currentModel.id}${currentModel.kind === "router" ? "  ·  router" : ""}`
    : selectedModel || fallback || "(none)";

  return (
    <Select value={selectedModel} onValueChange={onSelectModel}>
      <SelectTrigger
        size="sm"
        aria-label="Choose model"
        className="tw:mt-0.5 tw:inline-flex tw:max-w-full tw:h-auto tw:border-0 tw:bg-transparent tw:font-mono tw:text-[10.5px] tw:text-muted-foreground tw:p-0 tw:gap-0.5 tw:hover:text-foreground tw:shadow-none tw:hover:bg-transparent tw:dark:bg-transparent tw:dark:hover:bg-transparent tw:[&_svg:last-child]:size-3"
      >
        <span className="tw:truncate">{currentLabel}</span>
        <SelectValue asChild>
          <span />
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="tw:font-mono tw:text-xs">
        {sorted.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.id}
            {m.kind === "router" ? "  ·  router" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function sortModels(models: NexusModel[]): NexusModel[] {
  return [...models].sort((a, b) => {
    const aRank = a.kind === "router" ? 0 : 1;
    const bRank = b.kind === "router" ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return a.id.localeCompare(b.id);
  });
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
    <div className="tw:flex tw:flex-1 tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:px-6 tw:py-6 tw:text-center">
      <div className="tw:flex tw:size-12 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/10 tw:text-primary tw:ring-1 tw:ring-primary/20">
        <Sparkles className="tw:size-5" />
      </div>
      <div className="tw:flex tw:max-w-md tw:flex-col tw:items-center tw:gap-2">
        <h3 className="tw:text-2xl tw:font-semibold tw:tracking-tight tw:text-foreground">
          Talk to a private model
        </h3>
        <p className="tw:text-sm tw:text-muted-foreground">
          {configured
            ? "Talks to Nexus through this DAppNode, with the official docs and your installed-package list as context. Pick a prompt or just start typing."
            : "Nexus chat hasn't been configured on this DAppNode yet."}
        </p>
      </div>
      {configured && (
        <div className="tw:grid tw:w-full tw:max-w-md tw:gap-2 tw:sm:grid-cols-2">
          {SUGGESTIONS.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onPick(prompt)}
              className="tw:h-auto tw:whitespace-normal tw:justify-start tw:py-3 tw:text-left tw:text-[13px] tw:leading-snug tw:font-normal tw:disabled:opacity-50"
            >
              {prompt}
            </Button>
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
  const stickRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pendingConfirm]);

  return (
    <div ref={scrollRef} className="tw:flex tw:flex-1 tw:flex-col tw:gap-6 tw:overflow-y-auto tw:px-6 tw:py-6">
      {messages.map((msg, idx) => {
        const isLast = idx === messages.length - 1;
        return msg.role === "user" ? (
          <UserBubble key={idx} text={msg.content} />
        ) : (
          <AssistantBubble
            key={idx}
            text={msg.content}
            isRunning={isRunning && isLast && !pendingConfirm}
          />
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
    <div className="tw:flex tw:gap-3">
      <span
        aria-hidden
        className="tw:mt-1.5 tw:h-full tw:w-0.5 tw:shrink-0 tw:rounded-full tw:bg-gradient-to-b tw:from-amber-500/80 tw:via-amber-500/40 tw:to-amber-500/0"
      />
      <div className="tw:min-w-0 tw:flex-1 tw:rounded-xl tw:border tw:border-amber-500/30 tw:bg-amber-500/5 tw:p-4">
        <div className="tw:flex tw:items-start tw:gap-2.5">
          <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-amber-500/15 tw:text-amber-600 tw:dark:text-amber-300">
            <ShieldAlert className="tw:size-4" />
          </div>
          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-semibold tw:text-foreground">
              Confirm tool call
            </div>
            <TypographyMuted className="tw:mt-0.5 tw:text-[12.5px]">
              The assistant wants to run a tool that changes state on this DAppNode.
            </TypographyMuted>
          </div>
        </div>

        <div className="tw:mt-3 tw:overflow-hidden tw:rounded-lg tw:border tw:border-border tw:bg-background">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-border tw:px-3 tw:py-2">
            <div className="tw:min-w-0 tw:flex tw:flex-col">
              <span className="tw:truncate tw:text-[13px] tw:font-semibold tw:text-foreground">
                {confirmation.displayName}
              </span>
              <code className="tw:truncate tw:font-mono tw:text-[10.5px] tw:text-muted-foreground">
                {confirmation.tool}
              </code>
            </div>
            <span className="tw:font-mono tw:text-[10.5px] tw:uppercase tw:tracking-wide tw:text-muted-foreground">
              mutating
            </span>
          </div>
          <pre className="tw:max-h-48 tw:overflow-auto tw:px-3 tw:py-2 tw:font-mono tw:text-[12px] tw:text-foreground">
            {formattedArgs}
          </pre>
        </div>

        <div className="tw:mt-3 tw:flex tw:items-center tw:justify-end tw:gap-2">
          <Button variant="outline" size="sm" onClick={() => onDecision("deny")}>
            Deny
          </Button>
          <Button size="sm" onClick={() => onDecision("approve")}>
            Approve & run
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="tw:flex tw:justify-end">
      <div className="tw:max-w-[85%] tw:whitespace-pre-wrap tw:rounded-2xl tw:rounded-tr-md tw:bg-muted tw:px-4 tw:py-2.5 tw:text-[14px] tw:text-foreground">
        {text}
      </div>
    </div>
  );
}

function AssistantBubble({ text, isRunning }: { text: string; isRunning: boolean }) {
  const showTyping = isRunning && !text;
  return (
    <div className="tw:flex tw:gap-3">
      <span
        aria-hidden
        className="tw:mt-1.5 tw:h-full tw:w-0.5 tw:shrink-0 tw:rounded-full tw:bg-gradient-to-b tw:from-primary/70 tw:via-primary/40 tw:to-primary/0"
      />
      <div className="tw:min-w-0 tw:flex-1 tw:pb-1 tw:text-[14px] tw:leading-relaxed tw:text-foreground">
        {showTyping ? <TypingDots /> : <Markdown content={text} />}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="tw:flex tw:items-center tw:gap-1.5 tw:py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="tw:inline-block tw:size-1.5 tw:rounded-full tw:bg-muted-foreground tw:animate-pulse"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "1.1s" }}
        />
      ))}
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
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="tw:shrink-0 tw:border-t tw:border-border tw:bg-background/40 tw:px-4 tw:py-3">
      {error && (
        <Alert variant="destructive" className="tw:mb-2 tw:py-2 tw:text-[12.5px]">
          <AlertTitle className="tw:text-[12.5px]">{error}</AlertTitle>
        </Alert>
      )}
      {/*
        Composer surface: matches the project's Input primitive idiom
        (border-input, focus ring via --ring). The textarea explicitly drops
        its own browser-default border (`border-0`) and outline so only the
        outer wrapper renders the visible frame.
      */}
      <div className="tw:flex tw:items-end tw:gap-2 tw:rounded-lg tw:border tw:border-input tw:bg-transparent tw:px-3 tw:py-1.5 tw:transition-colors tw:focus-within:border-ring tw:focus-within:ring-3 tw:focus-within:ring-ring/50 tw:dark:bg-input/30">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Send a message…"
          autoFocus
          style={{ fieldSizing: "content" } as React.CSSProperties}
          className="tw:max-h-44 tw:flex-1 tw:resize-none tw:appearance-none tw:border-0 tw:bg-transparent tw:py-1.5 tw:text-[14px] tw:leading-relaxed tw:text-foreground tw:shadow-none tw:outline-none tw:ring-0 tw:focus:outline-none tw:focus:ring-0 tw:placeholder:text-muted-foreground"
        />
        {isRunning ? (
          <Button size="icon-sm" variant="outline" onClick={onCancel} aria-label="Stop generating">
            <Square className="tw:fill-current" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            onClick={onSend}
            disabled={disabled || !draft.trim()}
            aria-label="Send message"
          >
            <ArrowUp />
          </Button>
        )}
      </div>
      <p className="tw:mt-1.5 tw:text-center tw:text-[10.5px] tw:text-muted-foreground">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}

/* ── CTAs ──────────────────────────────────────────────────────────── */

function NotConfigured({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="tw:shrink-0 tw:border-t tw:border-border tw:bg-muted/40 tw:px-5 tw:py-5">
      <div className="tw:mx-auto tw:flex tw:max-w-xl tw:flex-col tw:items-start tw:gap-2">
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:font-medium tw:text-foreground">
          <KeyRound className="tw:size-4 tw:text-muted-foreground" />
          Nexus chat is not configured on this DAppNode
        </div>
        <TypographyMuted className="tw:text-[12.5px]">
          Paste a Nexus API key to get started — generate one in the Nexus user portal. You can also
          set <code className="tw:rounded tw:bg-muted tw:px-1 tw:py-0.5 tw:font-mono">NEXUS_API_KEY</code>{" "}
          on the dappmanager container instead.
        </TypographyMuted>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <Button size="sm" onClick={onConfigure}>
            <KeyRound />
            Add API key
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(nexusExternalUrl, "_blank")}>
            Open Nexus
            <ExternalLink />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── API-key editor ────────────────────────────────────────────────── */

/**
 * Inline overlay for setting, replacing or clearing the Nexus API key without
 * leaving the chat. Validation happens server-side (the key is probed against
 * the gateway before it's persisted), so a bad key surfaces as an error here.
 */
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
    <div className="tw:absolute tw:inset-0 tw:z-10 tw:flex tw:items-start tw:justify-center tw:overflow-y-auto tw:bg-background/80 tw:backdrop-blur-sm tw:p-6">
      {/* Card + spacing follow the project's Dialog primitive: no leading icon,
          title/description stacked at the left edge, close button top-right, a
          full-bleed muted footer bar. */}
      <div className="tw:relative tw:w-full tw:max-w-md tw:overflow-hidden tw:rounded-xl tw:border tw:border-border tw:bg-card tw:shadow-lg">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
          disabled={busy}
          className="tw:absolute tw:top-2 tw:right-2"
        >
          <X />
        </Button>

        <div className="tw:flex tw:flex-col tw:gap-4 tw:p-4">
          <div className="tw:flex tw:flex-col tw:gap-1 tw:pr-8">
            <div className="tw:text-base tw:font-medium tw:leading-none tw:text-foreground">
              {status.configured ? "Update Nexus API key" : "Set Nexus API key"}
            </div>
            <TypographyMuted className="tw:text-[12.5px]">
              The key is stored on this DAppNode and used to talk to Nexus. Generate one in the Nexus
              user portal.
            </TypographyMuted>
          </div>

          {status.keySource === "env" && (
            <TypographyMuted className="tw:text-[12px]">
              A key is currently provided via the{" "}
              <code className="tw:rounded tw:bg-muted tw:px-1 tw:py-0.5 tw:font-mono">NEXUS_API_KEY</code>{" "}
              env var. Saving a key here overrides it.
            </TypographyMuted>
          )}

          {/*
            Input surface mirrors the Composer's: the visible frame lives on the
            wrapper (auto width, so it can't overflow the card) and the inner
            field is borderless with no horizontal padding.
          */}
          <div className="tw:flex tw:items-center tw:rounded-lg tw:border tw:border-input tw:bg-transparent tw:px-3 tw:py-1.5 tw:transition-colors tw:focus-within:border-ring tw:focus-within:ring-3 tw:focus-within:ring-ring/50 tw:dark:bg-input/30">
            <input
              type="password"
              value={value}
              autoFocus
              autoComplete="off"
              placeholder="sk-…"
              disabled={busy}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              className="tw:min-w-0 tw:flex-1 tw:appearance-none tw:border-0 tw:bg-transparent tw:py-1 tw:font-mono tw:text-[13px] tw:text-foreground tw:shadow-none tw:outline-none tw:ring-0 tw:placeholder:text-muted-foreground tw:focus:outline-none tw:focus:ring-0 tw:disabled:opacity-50"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="tw:py-2 tw:text-[12.5px]">
              <AlertTitle className="tw:text-[12.5px]">{error}</AlertTitle>
            </Alert>
          )}
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-border tw:bg-muted/40 tw:px-4 tw:py-3">
          <div>
            {status.keySource === "db" && (
              <Button variant="ghost" size="sm" onClick={clear} disabled={busy}>
                <Trash2 />
                Remove key
              </Button>
            )}
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={busy || !value.trim()}>
              {busy && <Spinner className="tw:size-3.5" />}
              {status.configured ? "Save" : "Save & connect"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
