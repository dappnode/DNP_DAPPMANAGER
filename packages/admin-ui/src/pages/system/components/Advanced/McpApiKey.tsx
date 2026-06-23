import React, { useEffect } from "react";
import ClipboardJS from "clipboard";
import { api, useApi } from "api";
import Card from "components/Card";
import Button from "components/Button";
import { InputForm } from "components/InputForm";
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";

export function McpApiKey() {
  const { data, mutate } = useApi.mcpApiKeyGet();
  const apiKey = data?.apiKey || "";

  useEffect(() => {
    const clipboard = new ClipboardJS(".copy-mcp-key");
    return () => clipboard.destroy();
  }, []);

  async function generateKey() {
    await withToastNoThrow(() => api.mcpApiKeyGenerate(), {
      message: "Generating MCP API key...",
      onSuccess: "MCP API key generated"
    });
    mutate();
  }

  async function removeKey() {
    await new Promise<void>((resolve) =>
      confirm({
        title: "Remove MCP API key",
        text: "External MCP clients will no longer be able to authenticate. You can generate a new key at any time.",
        label: "Remove",
        onClick: resolve
      })
    );

    await withToastNoThrow(() => api.mcpApiKeyRemove(), {
      message: "Removing MCP API key...",
      onSuccess: "MCP API key removed"
    });
    mutate();
  }

  return (
    <Card spacing>
      <p>
        External MCP clients (Claude Desktop, Cursor, etc.) connect to{" "}
        <code>https://my.dappnode/mcp</code> with an <code>Authorization: Bearer</code>{" "}
        token. Keep the token secret.
      </p>

      {apiKey ? (
        <>
          <InputForm
            fields={[
              {
                labelId: "mcp-api-key",
                label: "MCP API key",
                name: "mcp-api-key",
                value: apiKey,
                lock: true,
                onValueChange: () => {}
              }
            ]}
          >
            <Button className="copy-mcp-key" data-clipboard-text={apiKey}>
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
      ) : (
        <>
          <p>No MCP API key is configured.</p>
          <Button variant="dappnode" onClick={generateKey}>
            Generate MCP API key
          </Button>
        </>
      )}
    </Card>
  );
}
