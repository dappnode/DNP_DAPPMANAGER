import React, { useState } from "react";
import { api } from "api";
import Form from "react-bootstrap/esm/Form";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Input from "components/Input";
import Ok from "components/Ok";
import { ReqStatus } from "types";
import "./sshManager.scss";

export function SshManagerChangePort() {
  const [port, setPort] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function updatePort() {
    try {
      setReqStatus({ loading: true });
      await api.sshPortChange({ port: parseInt(port, 10) });
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on sshPortChange", e);
    }
  }

  const portError = validatePort(port);

  return (
    <>
      <Input
        placeholder="New SSH port i.e. 1024"
        value={port}
        onValueChange={setPort}
        type="number"
        isInvalid={Boolean(port && portError)}
        append={
          <Button
            variant="dappnode"
            disabled={!port || reqStatus.loading}
            onClick={updatePort}
          >
            Change
          </Button>
        }
      />
      {port && portError && (
        <Form.Text className="text-danger" as="span">
          {portError}
        </Form.Text>
      )}

      {reqStatus.loading && <Ok loading msg="Changing SSH port..."></Ok>}
      {reqStatus.result && <Ok ok msg="Changed SSH port"></Ok>}
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
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
