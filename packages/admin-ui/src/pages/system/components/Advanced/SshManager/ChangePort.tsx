import React, { useState } from "react";
import { api } from "api";
import Form from "react-bootstrap/esm/Form";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Input from "components/Input";
import Ok from "components/Ok";
import { ReqStatus } from "types";

export function SshManagerChangePort() {
  const [port, setPort] = useState("");
  const [reqGetStatus, setReqGetStatus] = useState<ReqStatus<number>>({});
  const [reqSetStatus, setReqSetStatus] = useState<ReqStatus>({});

  async function updatePort() {
    try {
      setReqSetStatus({ loading: true });
      await api.sshPortSet({ port: parseInt(port, 10) });
      setReqSetStatus({ result: true });
    } catch (e) {
      setReqSetStatus({ error: e });
      console.error("Error on sshPortSet", e);
    }
  }

  async function fetchPort() {
    try {
      setReqGetStatus({ loading: true });
      const _port = await api.sshPortGet();
      setPort(String(_port));
      setReqGetStatus({ result: _port });
    } catch (e) {
      setReqGetStatus({ error: e });
      console.error("Error on sshStatusGet", e);
    }
  }

  const portError = validatePort(port);
  const portIsSame = reqGetStatus.result && port && String(reqGetStatus.result) === port;

  return (
    <>
      <hr />
      <div className="subtle-header">CHANGE SSH PORT</div>
      <p>Change SSH port of your DAppNode. Port number must be greater than 0 and less than 65536</p>
      <Input
        value={port || "?"}
        onValueChange={setPort}
        type="number"
        isInvalid={Boolean(port && portError)}
        append={
          <>
            <Button disabled={reqGetStatus.loading} onClick={fetchPort}>
              Fetch port
            </Button>
            <Button variant="dappnode" disabled={!port || portIsSame || reqSetStatus.loading} onClick={updatePort}>
              Change
            </Button>
          </>
        }
      />
      {port && portError && (
        <Form.Text className="text-danger" as="span">
          {portError}
        </Form.Text>
      )}

      {reqGetStatus.loading && <Ok loading msg="Fetching SSH port..."></Ok>}
      {reqGetStatus.error && <ErrorView error={reqGetStatus.error} hideIcon red />}

      {reqSetStatus.loading && <Ok loading msg="Changing SSH port..."></Ok>}
      {reqSetStatus.result && <Ok ok msg="Changed SSH port"></Ok>}
      {reqSetStatus.error && <ErrorView error={reqSetStatus.error} hideIcon red />}
    </>
  );
}

function validatePort(portStr: string): string | null {
  const portNumber = parseInt(portStr);
  if (isNaN(portNumber)) return "Port is not a number";
  if (portNumber <= 0) return "Port must be > 0";
  if (portNumber >= 65536) return "Port must be < 65536";

  return null;
}
