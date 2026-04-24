import React from "react";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Card, CardContent } from "components/primitives/card";
import { Construction } from "lucide-react";

export function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader title="Staking Dashboard" description="Overview of your staking setup across all networks." />

      <Card>
        <CardContent className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:gap-4 tw:text-muted-foreground">
          <Construction className="tw:size-12" />
          <p className="tw:text-lg tw:font-medium">Under construction</p>
          <p className="tw:text-sm tw:max-w-md tw:text-center">
            The new staking dashboard is being built. In the meantime you can use the legacy UI.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
