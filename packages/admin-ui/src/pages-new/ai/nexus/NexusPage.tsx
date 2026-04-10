import * as React from "react";
import { PageContainer } from "components/primitives/page";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Separator } from "components/primitives/separator";
import { TypographyH4, TypographyInlineCode, TypographyMuted } from "components/primitives/typography";
import {
  ShieldCheck,
  Wallet,
  Plug,
  BarChart3,
  ExternalLink,
  Sparkles,
  UserPlus,
  CreditCard,
  KeyRound
} from "lucide-react";
import { nexusExternalUrl, nexusLandingPageUrl } from "./data";

/* ── Feature data ───────────────────────────────────────────────────── */

const features = [
  {
    icon: ShieldCheck,
    title: "Private AI Models",
    description: "All models through one unified API. Switch between private and standard models instantly."
  },
  {
    icon: Wallet,
    title: "Flexible Pricing",
    description: "Select between prepaid credits or monthly subscriptions based on your needs."
  },
  {
    icon: Plug,
    title: "Easy Integration",
    description: "Manage your API key to integrate the models with your preferred AI agents."
  },
  {
    icon: BarChart3,
    title: "Real-Time Usage",
    description: "Monitor how many tokens you're spending, on which models, over time."
  }
];

/* ── Getting-started steps ──────────────────────────────────────────── */

const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    description: "Sign up at Nexus to start running AI models privately."
  },
  {
    icon: CreditCard,
    title: "Buy credits or subscribe",
    description: "Get 5 € in free credits and test the power of private AI models."
  },
  {
    icon: KeyRound,
    title: "Create your API key",
    description: "Use your API key to set up models in your favourite AI agent."
  }
];

/* ── Page component ─────────────────────────────────────────────────── */

export function NexusPage() {
  return (
    <PageContainer className="tw:items-center">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="tw:flex tw:flex-col tw:items-center tw:text-center tw:max-w-2xl tw:gap-5">
        <Badge variant="secondary" className="tw:gap-1.5">
          <Sparkles className="tw:size-3" />
          Built into every Dappnode AI product
        </Badge>

        <h2 className="tw:text-3xl tw:sm:text-4xl tw:font-extrabold tw:tracking-tight tw:text-foreground tw:text-balance">
          The gateway for AI builders{" "}
          <span className="tw:bg-gradient-to-r tw:from-dn-blue tw:via-dn-cyan tw:to-dn-purple tw:bg-clip-text tw:text-transparent">
            who value privacy
          </span>
        </h2>

        <TypographyMuted className="tw:text-base tw:sm:text-lg tw:max-w-xl tw:leading-relaxed">
          Access top AI models through a single OpenAI-compatible API endpoint — filtered by privacy, speed, and
          reasoning level.
        </TypographyMuted>

        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-3 tw:pt-2">
          <Button size="lg" onClick={() => window.open(nexusLandingPageUrl, "_blank")}>
            Learn more
            <ExternalLink className="tw:size-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.open(nexusExternalUrl, "_blank")}>
            Open Dashboard
            <ExternalLink className="tw:size-4" />
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Integration callout ───────────────────────────────────── */}
      <Card className="tw:w-full tw:max-w-content-max tw:bg-primary/5 tw:ring-primary/20">
        <CardContent className="tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:gap-4">
          <div className="tw:flex tw:items-center tw:justify-center tw:size-10 tw:shrink-0 tw:rounded-lg tw:bg-primary/10 tw:text-primary">
            <Plug className="tw:size-5" />
          </div>
          <div className="tw:flex-1 tw:space-y-1">
            <TypographyH4>Nexus is integrated into every AI product in Dappnode</TypographyH4>
            <TypographyMuted>
              If a direct integration isn't available, you can always connect via the API endpoint:{" "}
              <TypographyInlineCode>nexus.dappnode.com/v1</TypographyInlineCode>
            </TypographyMuted>
          </div>
        </CardContent>
      </Card>

      {/* ── Features grid ─────────────────────────────────────────── */}
      <section className="tw:flex tw:flex-col tw:items-center tw:gap-section tw:w-full tw:max-w-content-max">
        <header className="tw:text-center">
          <TypographyH4>Key Benefits</TypographyH4>
          <TypographyMuted className="tw:mt-header-gap">
            Dappnode Nexus provides a curated selection of AI models to run in a few clicks.
          </TypographyMuted>
        </header>

        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-card tw:w-full">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div className="tw:flex tw:items-center tw:justify-center tw:size-9 tw:rounded-lg tw:bg-primary/10 tw:text-primary">
                    <f.icon className="tw:size-4.5" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="tw:text-sm tw:leading-relaxed">{f.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Getting started ───────────────────────────────────────── */}
      <section className="tw:flex tw:flex-col tw:items-center tw:gap-section tw:w-full tw:max-w-content-max">
        <header className="tw:text-center">
          <TypographyH4>How to Get Started</TypographyH4>
          <TypographyMuted className="tw:mt-header-gap">Three simple steps to start using Nexus.</TypographyMuted>
        </header>

        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-card tw:w-full">
          {steps.map((s, i) => (
            <Card key={s.title} className="tw:items-center tw:text-center">
              <CardHeader className="tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-3">
                <div className="tw:flex tw:items-center tw:justify-center tw:size-10 tw:rounded-full tw:bg-primary/10 tw:text-primary tw:ring-1 tw:ring-primary/20 tw:mb-1">
                  <span className="tw:text-sm tw:font-bold">{i + 1}</span>
                </div>
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="tw:leading-relaxed">{s.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-3">
          <Button onClick={() => window.open(nexusExternalUrl, "_blank")}>
            Create your account
            <ExternalLink className="tw:size-4" />
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}
