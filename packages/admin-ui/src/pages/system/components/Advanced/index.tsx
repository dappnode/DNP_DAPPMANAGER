import Card from "components/Card";
import SubTitle from "components/SubTitle";
import React from "react";
import { ChangeDappnodeWebName } from "./ChangeDappnodeWebName";
import { SshManager } from "./SshManager";
import { MaindbManager } from "./MaindbManager/index";
import { ClearCacheManager } from "./CacheManager/index";

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

      <SubTitle>Dappmanager database</SubTitle>
      <MaindbManager />

      <SubTitle>Dappmanager cache</SubTitle>
      <ClearCacheManager />
    </>
  );
}
