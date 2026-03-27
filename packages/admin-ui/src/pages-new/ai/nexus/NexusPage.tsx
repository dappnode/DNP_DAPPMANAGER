import * as React from "react";
import { TypographyH1, TypographyMuted } from "components/primitives/typography";
import { Button } from "components/primitives/button";
import { nexusExternalUrl } from "./data";

export function NexusPage() {
  return (
    <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
      <header>
        <TypographyH1 className="tw:border-none tw:pb-0">Nexus</TypographyH1>
        <TypographyMuted className="tw:mt-header-gap">
          Dappnode Nexus is a privacy-first AI gateway that routes your prompts to the best cloud model while protecting
          your data.
        </TypographyMuted>
        <TypographyMuted className="tw:mt-header-gap">
          To use it navigate directly to{" "}
          <Button variant="link" onClick={() => window.open(nexusExternalUrl, "_blank")} className="tw:px-0">
            Nexus Dashboard
          </Button>
          .
        </TypographyMuted>
      </header>
    </div>
  );
}
