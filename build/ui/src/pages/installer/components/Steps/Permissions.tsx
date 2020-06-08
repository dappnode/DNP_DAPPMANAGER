import React from "react";
import RenderMarkdown from "components/RenderMarkdown";
// Components
import Card from "components/Card";
import Button from "components/Button";
import StatusIcon from "components/StatusIcon";
import { SpecialPermission } from "types";

interface PermissionsProps {
  permissions: SpecialPermission[];
  onAccept: () => void;
  goBack: () => void;
}

const Permissions: React.FunctionComponent<PermissionsProps> = ({
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

  // "Requires no special permissions"
  return (
    <Card className="permissions-list" spacing divider>
      {permissions.map(({ name, details }) => (
        <div key={name}>
          <strong>{name}</strong>
          <div style={{ opacity: 0.6 }}>
            <RenderMarkdown source={details} />
          </div>
        </div>
      ))}
      {permissions.length === 0 && (
        <StatusIcon success message={"Requires no special permissions"} />
      )}
      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={onAccept}>
          {permissions.length === 0 ? "Next" : "Accept"}
        </Button>
      </div>
    </Card>
  );
};

export default Permissions;
