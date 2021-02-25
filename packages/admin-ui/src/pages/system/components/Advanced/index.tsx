import Card from "components/Card";
import SubTitle from "components/SubTitle";
import React from "react";
import { ChangeDappnodeWebName } from "./ChangeDappnodeWebName";
import { SshManager } from "./SshManager";

export function Advanced() {
  return (
    <>
      <SubTitle>Change DappNode Name</SubTitle>
      <Card spacing>
        <div>
          Dappnode name only affects to the User Web Interface. It's the name
          appears on the top navigation bar.
        </div>
        <ChangeDappnodeWebName />
      </Card>
      <SubTitle>SSH</SubTitle>
      <SshManager />
    </>
  );
}
