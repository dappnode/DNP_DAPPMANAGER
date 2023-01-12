import React from "react";
import RenderMarkdown from "components/RenderMarkdown";
// Components
import Card from "components/Card";
import Button from "components/Button";
import StatusIcon from "components/StatusIcon";
import { SpecialPermissionAllDnps } from "@dappnode/common";
import { prettyDnpName } from "utils/format";
import "./permissions.scss";

interface PermissionsProps {
  permissions: SpecialPermissionAllDnps;
  onAccept: () => void;
  goBack: () => void;
}

const Permissions: React.FC<PermissionsProps> = ({
  permissions,
  onAccept,
  goBack
}) => {
  /**
   * @param permissions = [{
   *   name: "Short description",
   *   details: "Long description of the capabilitites"
   * }, ... ]
   */
  return (
    <Card className="permissions-list" spacing divider>
      {Object.entries(permissions).map(([dnpName, permissionsDnp]) => (
        <div key={dnpName}>
          <div className="card-section-header">
            {prettyDnpName(dnpName)} special permissions
          </div>

          <div className="special-permission">
            {permissionsDnp.map(({ name, details }) => (
              <div key={name}>
                <strong>{name}</strong>
                <div className="details">
                  <RenderMarkdown source={details} />
                </div>
              </div>
            ))}

            {permissionsDnp.length === 0 && (
              <StatusIcon success message={"Requires no special permissions"} />
            )}
          </div>
        </div>
      ))}

      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </Card>
  );
};

export default Permissions;
