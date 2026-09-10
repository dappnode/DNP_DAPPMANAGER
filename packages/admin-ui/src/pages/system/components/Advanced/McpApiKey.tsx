import React, { useEffect, useState } from "react";
import ClipboardJS from "clipboard";
import { api, useApi } from "api";
import Card from "components/Card";
import Button from "components/Button";
import { InputForm } from "components/InputForm";
import { confirm } from "components/ConfirmDialog";
import { withToast, withToastNoThrow } from "components/toast/Toast";
import Switch from "components/Switch";

export function McpApiKey() {
  const { data, mutate } = useApi.mcpApiKeyGet();
  const [generatedApiKey, setGeneratedApiKey] = useState("");
  const hasApiKey = data?.hasApiKey || Boolean(generatedApiKey);
  const mutatingToolsEnabled = data?.mutatingToolsEnabled ?? false;

  useEffect(() => {
    const clipboard = new ClipboardJS(".copy-mcp-key");
    return () => clipboard.destroy();
  }, []);

  async function generateKey() {
    try {
      const { apiKey } = await withToast(() => api.mcpApiKeyGenerate(), {
        message: "Generating MCP API key...",
        onSuccess: "MCP API key generated"
      });
      setGeneratedApiKey(apiKey);
      mutate();
    } catch (e) {
      console.error(e);
    }
  }

  async function removeKey() {
    await new Promise<void>((resolve) =>
      confirm({
        title: "Remove MCP API key",
        text: "External MCP clients using this key will no longer be able to authenticate. You can generate a new key at any time.",
        label: "Remove",
        onClick: resolve
      })
    );

    try {
      await withToast(() => api.mcpApiKeyRemove(), {
        message: "Removing MCP API key...",
        onSuccess: "MCP API key removed"
      });
      setGeneratedApiKey("");
      mutate();
    } catch (e) {
      console.error(e);
    }
  }

  async function setMutatingToolsEnabled(enabled: boolean) {
    if (enabled) {
      await new Promise<void>((resolve) =>
        confirm({
          title: "Enable mutating MCP tools",
          text: "External MCP clients that can authenticate to this DAppNode will be able to run tools that change package state, including start, stop, restart, and custom package install actions.",
          label: "Enable",
          onClick: resolve
        })
      );
    }

    await withToastNoThrow(() => api.mcpMutatingToolsSet({ enabled }), {
      message: enabled ? "Enabling mutating MCP tools..." : "Disabling mutating MCP tools...",
      onSuccess: enabled ? "Mutating MCP tools enabled" : "Mutating MCP tools disabled"
    });
    mutate();
  }

  return (
    <Card spacing>
      <p>
        External MCP clients (Claude Desktop, Cursor, etc.) connect to <code>https://my.dappnode/mcp</code> with an{" "}
        <code>Authorization: Bearer</code> token. Keep the token secret.
      </p>

      {generatedApiKey ? (
        <>
          <InputForm
            fields={[
              {
                labelId: "mcp-api-key",
                label: "MCP API key",
                name: "mcp-api-key",
                value: generatedApiKey,
                lock: true,
                onValueChange: () => {}
              }
            ]}
          >
            <Button className="copy-mcp-key" data-clipboard-text={generatedApiKey}>
              Copy
            </Button>
          </InputForm>

          <div className="d-flex gap-2 mt-3">
            <Button variant="dappnode" onClick={generateKey}>
              Generate new key
            </Button>
            <Button variant="outline-danger" onClick={removeKey}>
              Remove key
            </Button>
          </div>
        </>
      ) : hasApiKey ? (
        <>
          <p>An MCP API key is configured. Generate a new key if you need to copy it again.</p>
          <div className="d-flex gap-2">
            <Button variant="dappnode" onClick={generateKey}>
              Generate new key
            </Button>
            <Button variant="outline-danger" onClick={removeKey}>
              Remove key
            </Button>
          </div>
        </>
      ) : (
        <>
          <p>No MCP API key is configured.</p>
          <Button variant="dappnode" onClick={generateKey}>
            Generate MCP API key
          </Button>
        </>
      )}

      <hr />

      <div className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <strong>Allow mutating MCP tools</strong>
          <p className="mb-0">
            External MCP clients can run package-changing tools when this is enabled. Read-only tools remain available
            either way.
          </p>
        </div>
        <Switch id="mcp-mutating-tools-enabled" checked={mutatingToolsEnabled} onToggle={setMutatingToolsEnabled} />
      </div>
    </Card>
  );
}
