import React from "react";
import SecurityIssues from "./securityIssues";
import HostUpdates from "./hostUpdate";
import SubTitle from "components/SubTitle";

export default function SystemSecurity() {
  return (
    <>
      <SecurityIssues />
      <SubTitle>Host update</SubTitle>
      <HostUpdates />
    </>
  );
}
