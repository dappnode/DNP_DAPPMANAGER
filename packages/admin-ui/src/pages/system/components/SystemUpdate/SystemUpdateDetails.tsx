import React from "react";
import { useSelector, useDispatch } from "react-redux";
import DependencyList from "pages/installer/components/InstallCardComponents/DependencyList";
import RenderMarkdown from "components/RenderMarkdown";
// Actions
import { updateCore } from "services/coreUpdate/actions";
// Selectors
import { getCoreUpdateData } from "services/coreUpdate/selectors";
// Components
import Card from "components/Card";
import Button from "components/Button";
// Icons
import { FaArrowRight } from "react-icons/fa";
import { DependencyListItem } from "@dappnode/common";

export default function SystemUpdateDetails() {
  const coreUpdateData = useSelector(getCoreUpdateData);
  const dispatch = useDispatch();

  if (coreUpdateData === null || !coreUpdateData.available) {
    return null;
  }

  const coreChangelog = coreUpdateData.changelog;
  const updateAlerts = coreUpdateData.updateAlerts;
  const coreDeps = getCoreDeps(coreUpdateData.packages);

  return (
    <Card className="system-update-grid" spacing>
      {coreChangelog && <RenderMarkdown source={coreChangelog} />}

      {updateAlerts.map(({ from, to, message }) => (
        <div
          key={from + to}
          className="alert alert-warning"
          style={{ margin: "12px 0 6px 0" }}
        >
          {/* If there are multiple alerts, display the update jump */}
          {updateAlerts.length > 1 && (
            <div style={{ fontWeight: "bold" }}>
              {from} <FaArrowRight style={{ fontSize: ".7rem" }} /> {to}
            </div>
          )}
          <RenderMarkdown source={message} />
        </div>
      ))}

      {/* Dedicated per core version update and warnings */}
      <DependencyList deps={coreDeps} />

      <Button variant="dappnode" onClick={() => dispatch(updateCore())}>
        Update
      </Button>
    </Card>
  );
}

/**
 * Returns core dependencies,
 * unless the core package is the only one, then returns it
 */
export function getCoreDeps(
  corePackages: DependencyListItem[]
): DependencyListItem[] {
  const coreDeps = corePackages.filter(
    dnp => !(dnp.name || "").includes("core")
  );
  if (coreDeps.length) return coreDeps;

  const coreDnp = corePackages.find(dnp => (dnp.name || "").includes("core"));
  if (coreDnp) {
    // #### TODO: to prevent show the legacy OpenVPN 0.2.0 warning alert
    // remove the warning on install for the core.dnp.dappnode.eth DNP
    // Alerts can be added via the conditional update alerts
    coreDnp.warningOnInstall = "";
    return [coreDnp];
  }

  return [];
}
