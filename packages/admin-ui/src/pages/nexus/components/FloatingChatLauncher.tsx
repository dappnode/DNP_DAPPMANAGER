import React, { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MdChatBubbleOutline } from "react-icons/md";
import { ChatPanel, useNexusChat } from "./ChatPanel";
import "./floatingChat.scss";

const HIDE_ON_PATH_PREFIXES = ["/nexus"];

export function FloatingChatLauncher() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isFloatingOpen, hasFloatingOpened, openFloatingChat, closeFloatingChat } = useNexusChat();

  const hideEntirely = HIDE_ON_PATH_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  const openFullScreen = useCallback(() => {
    closeFloatingChat();
    navigate("/nexus", {
      state: {
        nexusReturnTo: `${location.pathname}${location.search}${location.hash}`
      }
    });
  }, [closeFloatingChat, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isFloatingOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFloatingChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFloatingOpen, closeFloatingChat]);

  if (hideEntirely) return null;

  return (
    <>
      {isFloatingOpen && <div className="nexus-floating-backdrop" onClick={closeFloatingChat} aria-hidden="true" />}

      <button
        type="button"
        onClick={isFloatingOpen ? closeFloatingChat : openFloatingChat}
        aria-label={isFloatingOpen ? "Close Nexus chat" : "Open Nexus chat"}
        aria-expanded={isFloatingOpen}
        className="nexus-floating-bubble"
      >
        <MdChatBubbleOutline />
      </button>

      {hasFloatingOpened && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Nexus chat"
          className={`nexus-floating-panel ${isFloatingOpen ? "open" : "closed"}`}
        >
          <ChatPanel variant="floating" onOpenFullScreen={openFullScreen} />
        </div>
      )}
    </>
  );
}
