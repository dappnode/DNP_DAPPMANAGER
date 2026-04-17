import React from "react";
import { docsUrl } from "params";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { ExternalLink, BookOpen, Code } from "lucide-react";

interface DocsCard {
  title: string;
  description: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  urlLabel: string;
}

const docsCards: DocsCard[] = [
  {
    title: "User Documentation",
    description:
      "Everything you need to get started with your Dappnode — from initial setup and connecting to your node, to staking, managing packages, and troubleshooting common issues.",
    highlights: ["Getting started & setup", "Access methods (VPN, Wi-Fi, Local)", "Staking & package management"],
    icon: BookOpen,
    url: docsUrl.userDocumentation,
    urlLabel: "Browse User Docs"
  },
  {
    title: "Developer Documentation",
    description:
      "Build and publish your own Dappnode packages. Learn about the SDK toolchain, the APM registry, package architecture, and how to contribute to the Dappnode ecosystem.",
    highlights: ["SDK & CLI reference", "Package publishing workflow", "Architecture & contribution guides"],
    icon: Code,
    url: docsUrl.devsDocumentation,
    urlLabel: "Browse Developer Docs"
  }
];

export function DocsSection() {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-card">
      {docsCards.map((card) => (
        <Card key={card.title}>
          <CardContent className="tw:flex tw:flex-col tw:gap-4">
            {/* Icon + title */}
            <div className="tw:flex tw:items-center tw:gap-2.5">
              <div className="tw:flex tw:items-center tw:justify-center tw:size-9 tw:rounded-lg tw:bg-primary/10">
                <card.icon className="tw:size-4.5 tw:text-primary" />
              </div>
              <p className="tw:font-semibold">{card.title}</p>
            </div>

            {/* Description */}
            <p className="tw:text-muted-foreground tw:leading-relaxed">{card.description}</p>

            {/* Highlight bullets */}
            <ul className="tw:space-y-1.5">
              {card.highlights.map((item) => (
                <li key={item} className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-muted-foreground">
                  <span className="tw:size-1.5 tw:rounded-full tw:bg-primary/40 tw:shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="outline" size="sm" asChild className="tw:self-start tw:mt-auto">
              <a href={card.url} target="_blank" rel="noopener noreferrer">
                {card.urlLabel}
                <ExternalLink className="tw:size-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
