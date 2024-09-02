import Card from "components/Card";
import SubTitle from "components/SubTitle";
import React from "react";
import { ChangeDappnodeWebName } from "./ChangeDappnodeWebName";
import { SshManager } from "./SshManager";
import { ClearCacheDb } from "./ClearCacheDb";
import { ClearMainDb } from "./ClearMainDb";
import { ReleaseTrustedKeysEditor } from "./ReleaseTrustedKeysEditor";
import { UpdateUpgrade } from "./UpdateUpgrade";
import { DockerUpgrade } from "./DockerUpgrade";

export function Advanced() {
  return (
    <>
      <SubTitle>Change DappNode Name</SubTitle>
      <Card spacing>
        <div>
          Dappnode name only affects to the User Web Interface. It's the name appears on the top navigation bar.
        </div>
        <ChangeDappnodeWebName />
      </Card>

      <SubTitle>SSH</SubTitle>
      <SshManager />

      <SubTitle>Release trusted keys</SubTitle>
      <ReleaseTrustedKeysEditor />

      <SubTitle>Update and upgrade the host machine</SubTitle>
      <UpdateUpgrade />

      <SubTitle>Docker update</SubTitle>
      <DockerUpgrade />

      <SubTitle>Clear cache db</SubTitle>
      <ClearCacheDb />

      <SubTitle>Clear main db</SubTitle>
      <ClearMainDb />
    </>
  );
}
