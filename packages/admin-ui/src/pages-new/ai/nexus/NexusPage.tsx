import * as React from "react";
import { PageContainer, PageHeader, PageDescription } from "components/primitives/page";
import { Button } from "components/primitives/button";
import { nexusExternalUrl } from "./data";

export function NexusPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Nexus"
        description="Dappnode Nexus is a privacy-first AI gateway that routes your prompts to the best cloud model while protecting your data."
      >
        <PageDescription>
          To use it navigate directly to{" "}
          <Button variant="link" onClick={() => window.open(nexusExternalUrl, "_blank")} className="tw:px-0">
            Nexus Dashboard
          </Button>
          .
        </PageDescription>
      </PageHeader>
    </PageContainer>
  );
}
