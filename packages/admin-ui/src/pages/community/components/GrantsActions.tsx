import React from "react";
import Button from "components/Button";
import { dappnodeGitcoin } from "params";

export default function GrantsActions() {
  return (
    <Button onClick={() => window.open(dappnodeGitcoin)}>Contribute</Button>
  );
}
