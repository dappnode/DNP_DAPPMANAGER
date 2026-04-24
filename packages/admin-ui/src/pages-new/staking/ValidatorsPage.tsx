import React from "react";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Card, CardContent } from "components/primitives/card";
import { Construction } from "lucide-react";

export function ValidatorsPage() {
  return (
    <PageContainer>
      <PageHeader title="Validators" description="Manage your validators and monitor their performance." />

      <Card>
        <CardContent className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:gap-4 tw:text-muted-foreground">
          <Construction className="tw:size-12" />
          <p className="tw:text-lg tw:font-medium">Under construction</p>
          <p className="tw:text-sm tw:max-w-md tw:text-center">
            The new validators page is being built. In the meantime you can use the legacy UI.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
