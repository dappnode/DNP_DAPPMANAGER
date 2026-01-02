import React from "react";
import Input from "./Input";
import { IPFS_DAPPNODE_GATEWAY, IPFS_GATEWAY_CHECKER } from "params";
import RenderMarkdown from "./RenderMarkdown";

const description = `Configure the IPFS gateway URLs used for fetching Dappnode packages. The system will try your local IPFS node first, then race all configured gateways simultaneously - the first to respond wins.

Enter multiple URLs separated by commas. You can find public gateways at [${IPFS_GATEWAY_CHECKER}](${IPFS_GATEWAY_CHECKER}).

Default gateway: [${IPFS_DAPPNODE_GATEWAY}](${IPFS_DAPPNODE_GATEWAY})`;

/**
 * Simple component to configure IPFS gateway URLs
 */
export function IpfsClient({
  gatewayUrls,
  onGatewayUrlsChange
}: {
  /** Comma-separated gateway URLs string for display/editing */
  gatewayUrls: string | null;
  /** Callback receives comma-separated string of URLs */
  onGatewayUrlsChange: (newUrls: string) => void;
}) {
  return (
    <div className="ipfs-gateway-config">
      <div className="description" style={{ marginBottom: "1rem" }}>
        <RenderMarkdown source={description} />
      </div>

      <label style={{ fontWeight: 500, marginBottom: "0.5rem", display: "block" }}>Gateway URLs</label>
      <Input
        placeholder="https://ipfs-gateway.dappnode.net, https://ipfs-gateway-dev.dappnode.net, https://gateway.pinata.cloud, https://cloudflare-ipfs.com"
        value={gatewayUrls || ""}
        onValueChange={onGatewayUrlsChange}
      />
    </div>
  );
}
