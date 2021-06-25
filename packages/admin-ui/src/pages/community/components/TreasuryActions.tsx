import Button from "components/Button";
import React from "react";
import { mediumTreasuryUrl, explorerTreasuryUrl } from "params";

export default function TreasuryActions() {
  return (
    <>
      <Button onClick={() => window.open(mediumTreasuryUrl)}>Read more</Button>
      <Button onClick={() => window.open(explorerTreasuryUrl)}>
        Check my ranking
      </Button>
    </>
  );
}
