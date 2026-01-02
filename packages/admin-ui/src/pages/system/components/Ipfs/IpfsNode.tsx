import React, { useState, useEffect } from "react";
import { useApi, api } from "api";
import { withToast } from "components/toast/Toast";
import { IpfsClient } from "components/IpfsClient";
import Button from "components/Button";
import LinkDocs from "components/LinkDocs";
import { forumUrl } from "params";
import Card from "components/Card";
import SubTitle from "components/SubTitle";

/**
 * Converts array of URLs to comma-separated string for display
 */
function urlsToString(urls: string[]): string {
  return urls.join(", ");
}

/**
 * Parses comma-separated string to array of URLs, trimming whitespace
 */
function stringToUrls(str: string): string[] {
  return str
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

export default function IpfsNode() {
  const ipfsRepository = useApi.ipfsGatewayUrlsGet();
  // Store as comma-separated string for easier editing
  const [ipfsGatewayUrlsStr, setIpfsGatewayUrlsStr] = useState<string>("");

  useEffect(() => {
    if (ipfsRepository.data) {
      setIpfsGatewayUrlsStr(urlsToString(ipfsRepository.data.ipfsGatewayUrls));
    }
  }, [ipfsRepository.data]);

  async function saveGatewayUrls() {
    if (ipfsGatewayUrlsStr) {
      const gatewayUrls = stringToUrls(ipfsGatewayUrlsStr);
      if (gatewayUrls.length === 0) {
        // Don't allow empty gateway URLs
        return;
      }

      await withToast(
        () =>
          api.ipfsGatewayUrlsSet({
            ipfsGatewayUrls: gatewayUrls
          }),
        {
          message: "Saving IPFS gateway URLs...",
          onSuccess: "Successfully updated IPFS gateway URLs"
        }
      );
    }
    await ipfsRepository.revalidate();
  }

  /**
   * Check if settings have changed from saved values
   */
  function hasChanges(): boolean {
    if (!ipfsRepository.data) return false;

    const savedUrls = ipfsRepository.data.ipfsGatewayUrls;
    const currentUrls = stringToUrls(ipfsGatewayUrlsStr);

    return JSON.stringify(savedUrls) !== JSON.stringify(currentUrls);
  }

  return (
    <div className="dappnode-identity">
      <SubTitle>IPFS Gateway Configuration</SubTitle>
      <div className="section-spacing">
        <Card>
          <div>
            Dappnode uses IPFS to distribute packages in a decentralized way. Configure your IPFS gateway URLs below.
          </div>
          <div>
            <strong>Resilient fetching:</strong> The system will try your local IPFS node first (if available), then
            race all configured gateways simultaneously - the first to respond wins.
          </div>

          {ipfsRepository.data ? (
            <>
              <IpfsClient gatewayUrls={ipfsGatewayUrlsStr} onGatewayUrlsChange={setIpfsGatewayUrlsStr} />

              <br />

              <div style={{ textAlign: "end" }}>
                <Button variant="dappnode" onClick={saveGatewayUrls} disabled={!hasChanges()}>
                  Save
                </Button>
              </div>
            </>
          ) : null}
          <div>
            More information at: <LinkDocs href={forumUrl.ipfsRemoteHowTo}>How to use Dappnode IPFS remote</LinkDocs>
          </div>
        </Card>
      </div>
    </div>
  );
}
