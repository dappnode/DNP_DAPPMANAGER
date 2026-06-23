import React from "react";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Separator } from "components/primitives/separator";
import { TypographyH4 } from "components/primitives/typography";
import { SdkSection } from "./SdkSection";
import { CommunitySection } from "./CommunitySection";
import { DocsSection } from "./DocsSection";

export function EcosystemPage() {
  return (
    <PageContainer>
      <PageHeader title="Ecosystem" description="Developer tools and community resources for the Dappnode ecosystem." />

      <section className="tw:space-y-4">
        <TypographyH4>Community</TypographyH4>
        <CommunitySection />
      </section>

      <Separator />

      <section className="tw:space-y-4">
        <TypographyH4>Docs</TypographyH4>
        <DocsSection />
      </section>

      <Separator />

      <section className="tw:space-y-4">
        <TypographyH4>SDK</TypographyH4>
        <SdkSection />
      </section>
    </PageContainer>
  );
}
