import React from "react";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Card, CardHeader, CardTitle, CardContent } from "components/primitives/card";

/**
 * System Info page — placeholder for system information display.
 *
 * Will eventually show host stats, versions, disk/memory usage, etc.
 */
export function SystemInfoPage() {
  return (
    <PageContainer>
      <PageHeader title="System Info" description="Overview of your Dappnode system." />

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-card">
        <Card>
          <CardHeader>
            <CardTitle>Host</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tw:text-sm tw:text-muted-foreground">Host information will be displayed here.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tw:text-sm tw:text-muted-foreground">Package versions will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
