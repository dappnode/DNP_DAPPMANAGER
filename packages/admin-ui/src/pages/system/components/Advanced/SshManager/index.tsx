import React from "react";
import Card from "components/Card";
import { SshManagerChangePort } from "./ChangePort";
import { SshManagerChangeStatus } from "./ChangeStatus";

export function SshManager() {
  return (
    <Card>
      <div className="subtle-header">ENABLE, DISABLE SSH</div>
      <p>
        Enable and start or disable and stop the ssh.service of your DAppNode
      </p>
      <SshManagerChangeStatus />

      <hr />

      <div className="subtle-header">CHANGE SSH PORT</div>
      <p>
        Change SSH port of your DAppNode. Port number must be greater than 0 and
        less than 65536
      </p>
      <SshManagerChangePort />
    </Card>
  );
}
