import React from "react";
import { ModulesContext } from "types";
import Card from "components/Card";
import Switch from "components/Switch";
import { HelpTo } from "components/Help";
import { docsUrl } from "params";

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
    <div className="dashboard-cards">
      <ModuleCard
        name="Stakers"
        help={docsUrl.stakers}
        checked={stakersModuleStatus === "enabled"}
        onToggle={toggleStakersModuleStatus}
      />

      <ModuleCard
        name="Rollups"
        help={docsUrl.rollups}
        checked={rollupsModuleStatus === "enabled"}
        onToggle={toggleRollupsModuleStatus}
      />
    </div>
  );
}

function ModuleCard({
  name,
  help,
  checked,
  onToggle
}: {
  name: string;
  help: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="module-card">
      <div className="name">
        <span className="text">{name}</span>
        {help && <HelpTo url={help} />}
      </div>
      <div className="switch">
        <Switch checked={checked} onToggle={onToggle} />
      </div>
    </Card>
  );
}
