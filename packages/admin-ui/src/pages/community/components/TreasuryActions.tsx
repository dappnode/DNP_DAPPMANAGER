import Button from "components/Button";
import React from "react";
import { mediumTreasuryUrl, explorerTreasuryUrl } from "params";

export default function TreasuryActions() {
  return (
    <>
      <Button href={mediumTreasuryUrl}>Read more</Button>
      <Button href={explorerTreasuryUrl}>Check my ranking</Button>
    </>
  );
}
