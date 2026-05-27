import * as React from "react";
import { ExternalLink } from "lucide-react";
import { PageContainer, PageHeader, PageTitle, PageDescription } from "components/primitives/page";
import { Button } from "components/primitives/button";
import { TypographyMuted } from "components/primitives/typography";
import { ChatPanel } from "./chat/ChatPanel";
import { nexusExternalUrl } from "./data";

/**
 * Nexus chat — a small free playground that lives on this DAppNode.
 *
 * The dappmanager backend holds the Nexus API key and proxies every
 * request, so the key never reaches the browser. A locally-tracked
 * quota gates the "Open Nexus" CTA. Once Nexus exposes an anonymous
 * signup endpoint we'll auto-provision instead of relying on an
 * env-configured key.
 */
export function NexusPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <span className="tw:inline-flex tw:items-baseline tw:gap-2">
            Nexus chat
            <span className="tw:font-mono tw:text-xs tw:font-normal tw:tracking-tight tw:text-muted-foreground">
              · powered by your DAppNode
            </span>
          </span>
        </PageTitle>
        <PageDescription>
          A private model, reached through this node's Nexus gateway. Free for the first few
          messages — then{" "}
          <a
            href={nexusExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:text-primary tw:underline tw:underline-offset-2"
          >
            open Nexus
          </a>{" "}
          for the full experience.
        </PageDescription>
      </PageHeader>

      <ChatPanel />

      <footer className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:pt-2">
        <TypographyMuted className="tw:text-[12px]">
          Your prompts leave this DAppNode through the Nexus gateway. Nexus is built by DAppNode.
        </TypographyMuted>
        <Button
          variant="link"
          size="sm"
          onClick={() => window.open(nexusExternalUrl, "_blank")}
          className="tw:px-0"
        >
          About Nexus
          <ExternalLink />
        </Button>
      </footer>
    </PageContainer>
  );
}
