import React from "react";
import { sdkPublishAppUrl, docsUrl, sdkRepoUrl } from "params";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { ExternalLink, Globe, BookOpen, Shield, Database } from "lucide-react";

interface SdkLink {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  urlLabel: string;
}

const sdkGuides: SdkLink[] = [
  {
    title: "Package Publishing Guide",
    description: "Learn how to create, build, and publish Dappnode packages to an APM registry.",
    icon: BookOpen,
    url: docsUrl.publishPkgGuide,
    urlLabel: "Read Guide"
  },
  {
    title: "Package Ownership Guide",
    description: "Understand how package ownership works and how to manage repository permissions.",
    icon: Shield,
    url: docsUrl.ownershipPkgGuide,
    urlLabel: "Read Guide"
  }
];

export function SdkSection() {
  return (
    <div className="tw:space-y-4">
      {/* APM registry explanation */}
      <Card>
        <CardContent className="tw:flex tw:items-start tw:gap-3">
          <div className="tw:flex tw:items-center tw:justify-center tw:size-9 tw:rounded-lg tw:bg-primary/10 tw:shrink-0 tw:mt-0.5">
            <Database className="tw:size-4.5 tw:text-primary" />
          </div>
          <div className="tw:flex tw:flex-col tw:gap-2 tw:space-y-1.5">
            <p className="tw:font-medium">Aragon Package Manager (APM) Registry</p>
            <p className="tw:text-muted-foreground tw:leading-relaxed">
              Dappnode packages are distributed through an on-chain registry powered by Aragon&apos;s APM smart
              contracts on Ethereum mainnet. A public registry is deployed at{" "}
              <a
                href="https://etherscan.io/address/public.dappnode.eth"
                target="_blank"
                rel="noopener noreferrer"
                className="tw:text-primary tw:underline tw:underline-offset-2"
              >
                public.dappnode.eth
              </a>
              , where anyone can create their own repository and publish packages. The typical workflow involves
              installing the SDK CLI via npm, initializing your Dappnode package, building its Docker image, and
              publishing the release to the APM — all from the command line.
            </p>
            <div className="tw:flex tw:flex-row tw:gap-2">
              <Button variant="outline" size="sm" asChild className="tw:self-start">
                <a href={docsUrl.sdkGuideUrl} target="_blank" rel="noopener noreferrer">
                  View SDK Guide
                  <ExternalLink className="tw:size-3.5" />
                </a>
              </Button>{" "}
              <Button size="sm" asChild className="tw:self-start">
                <a href={sdkRepoUrl} target="_blank" rel="noopener noreferrer">
                  Check SDK Repo
                  <ExternalLink className="tw:size-3.5" />
                </a>
              </Button>{" "}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK overview */}
      <Card>
        <CardContent className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:flex tw:items-center tw:justify-center tw:size-9 tw:rounded-lg tw:bg-primary/10 tw:shrink-0">
              <Globe className="tw:size-4.5 tw:text-primary" />
            </div>
            <div>
              <p className="tw:font-medium">Dappnode SDK-Publish</p>
              <p className="tw:text-muted-foreground">
                A web UI for publishing new package versions and managing repository permissions on the APM.
              </p>
            </div>
          </div>
          <Button asChild>
            <a href={sdkPublishAppUrl} target="_blank" rel="noopener noreferrer">
              Open SDK Publish UI
              <ExternalLink className="tw:size-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Guide links */}
      {sdkGuides.map((guide) => (
        <Card key={guide.title}>
          <CardContent className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:flex tw:items-center tw:justify-center tw:size-9 tw:rounded-lg tw:bg-primary/10 tw:shrink-0">
                <guide.icon className="tw:size-4.5 tw:text-primary" />
              </div>
              <div>
                <p className="tw:font-medium">{guide.title}</p>
                <p className="tw:text-muted-foreground">{guide.description}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={guide.url} target="_blank" rel="noopener noreferrer">
                {guide.urlLabel}
                <ExternalLink className="tw:size-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
