import Card from "components/Card";
import SubTitle from "components/SubTitle";
import React from "react";
import { ChangeDappnodeWebName } from "./ChangeDappnodeWebName";
import { SshManager } from "./SshManager";
import { ClearCacheDb } from "./ClearCacheDb";
import { ClearMainDb } from "./ClearMainDb";
import { ReleaseTrustedKeysEditor } from "./ReleaseTrustedKeysEditor";

export function Advanced() {
  return (
    <>
      <SubTitle>Change DappNode Name</SubTitle>
      <Card>
        <div>
          Dappnode name only affects to the User Web Interface. It's the name
          appears on the top navigation bar.
        </div>
        <ChangeDappnodeWebName />
      </Card>

      <SubTitle>SSH</SubTitle>
      <SshManager />

      <SubTitle>Release trusted keys</SubTitle>
      <ReleaseTrustedKeysEditor />

      <SubTitle>Clear cache db</SubTitle>
      <ClearCacheDb />

      <SubTitle>Clear main db</SubTitle>
      <ClearMainDb />
    </>
  );
}
