import React, { useState } from "react";
import Card from "components/Card";
import { SshManagerChangePort } from "./ChangePort";
import { SshManagerChangeStatus } from "./ChangeStatus";
import { ShhStatus } from "@dappnode/types";
import { ReqStatus } from "types";

export function SshManager() {
  const [reqGetStatus, setReqGetStatus] = useState<ReqStatus<ShhStatus>>({});

  return (
    <Card spacing>
      <SshManagerChangeStatus reqGetStatus={reqGetStatus} setReqGetStatus={setReqGetStatus} />
      {reqGetStatus.result === "enabled" && <SshManagerChangePort />}
    </Card>
  );
}
