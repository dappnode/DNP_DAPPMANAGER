import React from "react";
import { useSelector, useDispatch } from "react-redux";
import DependencyList from "pages/installer/components/InstallCardComponents/DependencyList";
import RenderMarkdown from "components/RenderMarkdown";
// Actions
import { updateCore } from "services/coreUpdate/actions";
// Selectors
import {
  getCoreDeps,
  getCoreUpdateAlerts,
  getCoreChangelog
} from "services/coreUpdate/selectors";
// Components
import Card from "components/Card";
import Button from "components/Button";
// Icons
import { FaArrowRight } from "react-icons/fa";

export default function SystemUpdateDetails() {
  const coreDeps = useSelector(getCoreDeps);
  const coreUpdateAlerts = useSelector(getCoreUpdateAlerts);
  const coreChangelog = useSelector(getCoreChangelog);
  const dispatch = useDispatch();

  return (
    <Card className="system-update-grid" spacing>
      {coreChangelog && <RenderMarkdown source={coreChangelog} />}

      {coreUpdateAlerts.map(({ from, to, message }) => (
        <div
          key={from + to}
          className="alert alert-warning"
          style={{ margin: "12px 0 6px 0" }}
        >
          {/* If there are multiple alerts, display the update jump */}
          {coreUpdateAlerts.length > 1 && (
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
