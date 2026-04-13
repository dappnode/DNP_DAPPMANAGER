import React from "react";
import { dappnodeDiscord, dappnodeGithub, givethDappnodeGrantUrl } from "params";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { ExternalLink, Heart, Github } from "lucide-react";
import { FaDiscord } from "react-icons/fa";

interface CommunityLink {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  urlLabel: string;
}

const communityLinks: CommunityLink[] = [
  {
    title: "Discord",
    description:
      "Get support, share your experience, and hang out with other Node Runners in the Dappnode Discord server.",
    icon: FaDiscord,
    url: dappnodeDiscord,
    urlLabel: "Join Discord"
  },
  {
    title: "Giveth Grant",
    description:
      "Support Dappnode's open-source mission with a donation on Giveth — every contribution makes a difference.",
    icon: Heart,
    url: givethDappnodeGrantUrl,
    urlLabel: "Go to Grant"
  },
  {
    title: "GitHub",
    description: "Dappnode is Free Open Source Software. Review and contribute to its codebase on GitHub.",
    icon: Github,
    url: dappnodeGithub,
    urlLabel: "View on GitHub"
  }
];

export function CommunitySection() {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-3 tw:gap-card">
      {communityLinks.map((link) => (
        <Card key={link.title}>
          <CardContent className="tw:flex tw:flex-col tw:gap-3 tw:py-5">
            <div className="tw:flex tw:items-center tw:gap-2.5">
              <div className="tw:flex tw:items-center tw:justify-center tw:size-9 tw:rounded-lg tw:bg-primary/10">
                <link.icon className="tw:size-4.5 tw:text-primary" />
              </div>
              <p className="tw:font-semibold">{link.title}</p>
            </div>
            <p className="tw:text-muted-foreground tw:leading-relaxed">{link.description}</p>
            <Button variant="outline" size="sm" asChild className="tw:self-start tw:mt-auto">
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="tw:size-3.5" />
                {link.urlLabel}
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
