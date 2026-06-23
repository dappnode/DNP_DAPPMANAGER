import React from "react";
import { PageContainer, PageHeader } from "components/primitives/page";
import { SystemHealthSection } from "./SystemHealthSection";
import { NetworkStatsSection } from "./NetworkStatsSection";
import { Separator } from "components/primitives/separator";

export function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader title="Welcome back, Node Runner" description="Overview of your staking setup and system health." />
      <SystemHealthSection />
      <Separator />
      <NetworkStatsSection />
    </PageContainer>
  );
}
