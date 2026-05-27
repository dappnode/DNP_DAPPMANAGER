import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Sparkles } from "lucide-react";
import { cn } from "lib/utils";
import { ChatPageContext } from "./api";
import { ChatPanel } from "./ChatPanel";

/**
 * App-wide chat launcher. Renders a bubble in the bottom-right corner; clicking
 * it slides out a Nexus chat panel anchored to the same corner. The chat
 * receives the current URL on every send so the model can answer "what is this
 * page?" without an extra round-trip.
 *
 * Lifecycle:
 *  - The panel is lazily mounted on the first open, then kept in the tree
 *    (just hidden) so an in-progress stream / draft survives close + reopen.
 *  - Hidden entirely on /ai/nexus, where the full-page chat already lives.
 */

const HIDE_ON_PATH_PREFIXES = ["/ai/nexus"];

export function FloatingChatLauncher() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);

  const hideEntirely = HIDE_ON_PATH_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  const open = useCallback(() => {
    setIsOpen(true);
    setHasEverOpened(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Esc to close — only attached while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Stable ref to the current location so the ChatPanel can read it lazily
  // at send-time (the user may have navigated since the panel was opened).
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const getPageContext = useCallback((): ChatPageContext | undefined => {
    const loc = locationRef.current;
    return {
      path: loc.pathname,
      ...(loc.search ? { search: loc.search } : {}),
      ...(loc.hash ? { hash: loc.hash } : {}),
      title: typeof document !== "undefined" ? document.title || undefined : undefined
    };
  }, []);

  // Wrap the close handler so it's referentially stable for the chat panel.
  const onRequestClose = useMemo(() => () => close(), [close]);

  if (hideEntirely) return null;

  return (
    <>
      {/* Backdrop tap-out — on small screens the panel takes most of the viewport,
          so tapping the dimmed area is the natural close gesture. */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close chat"
          onClick={close}
          className="tw:fixed tw:inset-0 tw:z-40 tw:cursor-default tw:bg-foreground/0 tw:sm:hidden"
        />
      )}

      {/* Bubble launcher */}
      <button
        type="button"
        onClick={isOpen ? close : open}
        aria-label={isOpen ? "Close Nexus chat" : "Open Nexus chat"}
        aria-expanded={isOpen}
        className={cn(
          "tw:fixed tw:bottom-5 tw:right-5 tw:z-50 tw:sm:bottom-6 tw:sm:right-6",
          "tw:flex tw:size-14 tw:items-center tw:justify-center tw:rounded-2xl tw:border-0",
          "tw:bg-[color-mix(in_oklab,var(--primary)_15%,var(--card))] tw:text-primary tw:shadow-md tw:shadow-primary/15",
          "tw:transition-all tw:duration-200 tw:outline-none tw:select-none",
          "tw:hover:bg-primary tw:hover:text-primary-foreground tw:hover:shadow-lg tw:hover:shadow-primary/40 tw:hover:-translate-y-0.5 tw:active:translate-y-0",
          "tw:focus-visible:ring-3 tw:focus-visible:ring-ring/50",
          "tw:disabled:pointer-events-none tw:disabled:opacity-50",
          "tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0"
        )}
      >
        {isOpen ? (
          <MessageSquare className="tw:size-6" aria-hidden />
        ) : (
          <Sparkles className="tw:size-6" aria-hidden />
        )}
      </button>

      {/* Panel — keeps mounted after first open so streams + drafts survive close */}
      {hasEverOpened && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Nexus chat"
          className={cn(
            // Position
            "tw:fixed tw:z-50",
            // Mobile: nearly fullscreen, gutter to leave the bubble tappable
            "tw:inset-3 tw:bottom-24",
            // ≥sm: anchored card in the bottom-right corner — bigger surface
            // so the conversation actually has room to breathe.
            "tw:sm:inset-auto tw:sm:bottom-24 tw:sm:right-6 tw:sm:w-[500px] tw:sm:max-w-[calc(100vw-3rem)]",
            // Height clamp so it can never overflow the viewport
            "tw:sm:h-[min(760px,calc(100svh-7rem))]",
            // Surface — matches the project's Card idiom (rounded-xl, ring on
            // foreground/10) but with a heavier shadow since this floats.
            "tw:overflow-hidden tw:rounded-xl tw:bg-card tw:text-card-foreground tw:shadow-2xl tw:shadow-foreground/15 tw:ring-1 tw:ring-foreground/10",
            // Open/close transition (display-toggle, so no enter anim — just keep it crisp)
            "tw:origin-bottom-right tw:transition-opacity tw:duration-150",
            isOpen ? "tw:opacity-100" : "tw:pointer-events-none tw:hidden tw:opacity-0"
          )}
        >
          <ChatPanel
            variant="floating"
            getPageContext={getPageContext}
            onRequestClose={onRequestClose}
          />
        </div>
      )}
    </>
  );
}
