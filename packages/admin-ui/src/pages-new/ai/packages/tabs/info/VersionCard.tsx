import React from "react";
import { InstalledPackageDetailData, Manifest, upstreamVersionToString } from "@dappnode/types";
import { Card, CardContent, CardHeader, CardTitle } from "components/primitives/card";
import { Separator } from "components/primitives/separator";
import { ExternalLink, Home, Settings, Bug, Globe } from "lucide-react";

const ipfsGatewayUrl = "http://ipfs.dappnode:8080";

export function VersionCard({ dnp, manifest }: { dnp: InstalledPackageDetailData; manifest?: Manifest }) {
  const { version, origin } = dnp;
  const { upstreamVersion, upstream, links, bugs } = manifest || {};

  const parsedUpstream = upstreamVersionToString({ upstreamVersion, upstream });
  const linksArray = buildLinksArray(links, bugs);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Info</CardTitle>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-4">
        {/* Version */}
        <div className="tw:flex tw:items-baseline tw:gap-2 tw:text-sm">
          <span className="tw:font-medium">Version</span>
          <span className="tw:text-muted-foreground">
            {version}
            {parsedUpstream && ` (${parsedUpstream} upstream)`}
          </span>
          {origin && (
            <a
              href={`${ipfsGatewayUrl}${origin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:text-primary tw:hover:underline tw:text-xs"
            >
              {origin}
            </a>
          )}
        </div>

        {/* Links */}
        {linksArray.length > 0 && (
          <>
            <Separator />
            <div className="tw:flex tw:flex-wrap tw:gap-2">
              {linksArray.map(({ name, url, icon: Icon }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-md tw:border tw:border-border tw:bg-muted/40 tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-foreground tw:transition-colors tw:hover:bg-muted"
                >
                  <Icon className="tw:size-3.5" />
                  {name}
                </a>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function buildLinksArray(
  links: Manifest["links"],
  bugs: Manifest["bugs"]
): { name: string; url: string; icon: React.FC<{ className?: string }> }[] {
  const arr: { name: string; url: string; icon: React.FC<{ className?: string }> }[] = [];

  const linksObj = typeof links === "string" ? { homepage: links } : typeof links === "object" ? links : {};

  for (const [name, url] of Object.entries(linksObj || {})) {
    if (!url) continue;
    const icon =
      name === "homepage" || name === "ui" || name === "webui"
        ? Home
        : name === "gateway"
        ? Globe
        : name === "api" || name === "apiEngine" || name === "engineAPI"
        ? Settings
        : ExternalLink;
    arr.push({ name, url, icon });
  }

  if (bugs?.url) {
    arr.push({ name: "Report bug", url: bugs.url, icon: Bug });
  }

  arr.sort((a) => (a.name === "homepage" ? -1 : 0));
  return arr;
}
