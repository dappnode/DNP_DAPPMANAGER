import React from "react";
import SecurityIssues from "./securityIssues";
import SecurityUpdate from "./securityUpdate";
import SubTitle from "components/SubTitle";

export default function SystemSecurity() {
  return (
    <>
      <SecurityIssues />
      <SubTitle>Security update</SubTitle>
      <SecurityUpdate />
    </>
  );
}
