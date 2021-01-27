import SubTitle from "components/SubTitle";
import React from "react";
import { SshManager } from "./SshManager";
import { MaindbManager } from "./MaindbManager/index";
import { ClearCacheManager } from "./CacheManager/index";

export function Advanced() {
  return (
    <>
      <SubTitle>SSH</SubTitle>
      <SshManager />

      <SubTitle>Database</SubTitle>
      <MaindbManager />

      <SubTitle>Cache</SubTitle>
      <ClearCacheManager />
    </>
  );
}
