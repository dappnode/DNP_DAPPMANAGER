import React from "react";
import SubTitle from "components/SubTitle";
import Lvm from "./Lvm";
import PowerManagment from "./PowerManagment";
import { UpdateUpgrade } from "./UpdateUpgrade";
import { DockerUpgrade } from "./DockerUpgrade";
import { SshManager } from "./SshManager";
import ChangeHostUserPassword from "./ChangeHostUserPassword";

export default function Host() {
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
