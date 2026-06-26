import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChatPanel, useNexusChat } from "./ChatPanel";
import "./nexus.scss";

export default function NexusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openFloatingChat } = useNexusChat();

  const openAsBubble = useCallback(() => {
    const state = location.state as { nexusReturnTo?: unknown } | null;
    const returnTo =
      typeof state?.nexusReturnTo === "string" && !state.nexusReturnTo.startsWith("/nexus")
        ? state.nexusReturnTo
        : "/dashboard";

    openFloatingChat();
    navigate(returnTo, { replace: true });
  }, [location.state, navigate, openFloatingChat]);

  return (
    <div className="nexus-page">
      <ChatPanel onOpenFloating={openAsBubble} />
    </div>
  );
}
