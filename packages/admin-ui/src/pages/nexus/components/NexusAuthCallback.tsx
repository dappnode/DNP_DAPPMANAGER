import React, { useEffect, useState } from "react";
import { buildNexusAuthCallbackMessage, readNexusAuthOpenerOrigin } from "../auth";

export default function NexusAuthCallback() {
  const [message, setMessage] = useState("Finishing Nexus login...");

  useEffect(() => {
    const callback = buildNexusAuthCallbackMessage(window.location);
    const openerOrigin = readNexusAuthOpenerOrigin(callback.state);

    if (!window.opener || window.opener.closed) {
      setMessage("This Nexus login window lost its opener. Close it and try again from Dappmanager.");
      return;
    }
    if (!openerOrigin) {
      setMessage("This Nexus login callback is invalid or expired. Close it and try again from Dappmanager.");
      return;
    }

    window.opener.postMessage(callback, openerOrigin);
    setMessage(callback.error ? "Nexus login did not complete." : "Nexus login complete. Returning to Dappmanager...");
    window.setTimeout(() => window.close(), callback.error ? 1200 : 400);
  }, []);

  return (
    <div className="nexus-auth-callback">
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
