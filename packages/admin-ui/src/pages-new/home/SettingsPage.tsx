import React from "react";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Card, CardHeader, CardTitle, CardContent } from "components/primitives/card";

/**
 * Settings page — placeholder for system-wide settings.
 *
 * Will eventually house DAppNode system preferences, network config, etc.
 */
export function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your Dappnode system settings." />

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="tw:text-sm tw:text-muted-foreground">System settings will be available here.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
