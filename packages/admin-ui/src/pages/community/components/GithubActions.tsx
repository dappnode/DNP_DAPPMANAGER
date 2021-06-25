import React from "react";
import Button from "components/Button";
import { dappnodeGithub } from "params";

export default function GithubActions() {
  return <Button onClick={() => window.open(dappnodeGithub)}>Github</Button>;
}
