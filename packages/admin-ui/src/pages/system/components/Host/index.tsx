import React from "react";
import SubTitle from "components/SubTitle";
import Lvm from "./Lvm";
import PowerManagment from "./PowerManagment";
import { UpdateUpgrade } from "./UpdateUpgrade";
import { DockerUpgrade } from "./DockerUpgrade";
import { SshManager } from "./SshManager";
import ChangeHostUserPassword from "./ChangeHostUserPassword";
import Card from "components/Card";
import { useApi } from "api";

export default function Host() {
  const disableHostScripts = useApi.disableHostScriptsGet();

  if (disableHostScripts.data) {
    return <Card spacing>Host integration features are disabled in this environment.</Card>;
  }

  return (
    <>
      <SubTitle>SSH</SubTitle>
      <SshManager />

      <SubTitle>Host user password</SubTitle>
      <ChangeHostUserPassword />

      <SubTitle>Docker update</SubTitle>
      <DockerUpgrade />

      <SubTitle>Update and upgrade the host machine</SubTitle>
      <UpdateUpgrade />

      <SubTitle>Power </SubTitle>
      <PowerManagment />

      <SubTitle>Expand disk</SubTitle>
      <Lvm />
    </>
  );
}
