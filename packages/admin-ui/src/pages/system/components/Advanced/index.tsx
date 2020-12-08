import Button from "components/Button";
import SubTitle from "components/SubTitle";
import React from "react";
import { SshManager } from "./SshManager";

export function Advanced() {
  return (
    <>
      <SubTitle>SSH</SubTitle>
      <SshManager />
    </>
  );
}
