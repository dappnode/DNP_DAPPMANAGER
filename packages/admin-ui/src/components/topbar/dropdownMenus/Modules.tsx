import React from "react";
import { ModulesContext } from "types";
import { docsUrl } from "params";
import BaseDropdown from "./BaseDropdown";
import { RiSoundModuleFill } from "react-icons/ri";

export default function Modules({
  modulesContext
}: {
  modulesContext: ModulesContext;
}) {
  const {
    stakersModuleStatus,
    rollupsModuleStatus,
    toggleStakersModuleStatus,
    toggleRollupsModuleStatus
  } = modulesContext;

  return (
    <BaseDropdown
      name="Modules"
      messages={[
        {
          title: "Stakers",
          help: docsUrl.stakers,
          toggle: {
            checked: stakersModuleStatus === "enabled",
            onToggle: toggleStakersModuleStatus
          }
        },
        {
          title: "Rollups",
          help: docsUrl.rollups,
          toggle: {
            checked: rollupsModuleStatus === "enabled",
            onToggle: toggleRollupsModuleStatus
          }
        }
      ]}
      Icon={RiSoundModuleFill}
      className={"modules"}
    />
  );
}
