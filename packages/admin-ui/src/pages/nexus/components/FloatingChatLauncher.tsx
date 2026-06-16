import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MdChatBubbleOutline } from "react-icons/md";
import { ChatPanel } from "./ChatPanel";
import "./floatingChat.scss";

const HIDE_ON_PATH_PREFIXES = ["/nexus"];

export function FloatingChatLauncher() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);

  const hideEntirely = HIDE_ON_PATH_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  const open = useCallback(() => {
    setIsOpen(true);
    setHasEverOpened(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (hideEntirely) return null;

  return (
    <>
      {isOpen && <div className="nexus-floating-backdrop" onClick={close} aria-hidden="true" />}

      <button
        type="button"
        onClick={isOpen ? close : open}
        aria-label={isOpen ? "Close Nexus chat" : "Open Nexus chat"}
        aria-expanded={isOpen}
        className="nexus-floating-bubble"
      >
        <MdChatBubbleOutline />
      </button>

      {hasEverOpened && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Nexus chat"
          className={`nexus-floating-panel ${isOpen ? "open" : "closed"}`}
        >
          <ChatPanel variant="floating" />
        </div>
      )}
    </>
  );
}
