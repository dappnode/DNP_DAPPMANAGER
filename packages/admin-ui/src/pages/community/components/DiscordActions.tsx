import Button from "components/Button";
import React from "react";
import { dappnodeDiscord } from "params";

export default function DiscordActions() {
  return (
    <Button onClick={() => window.open(dappnodeDiscord)}>Join Discord</Button>
  );
}
