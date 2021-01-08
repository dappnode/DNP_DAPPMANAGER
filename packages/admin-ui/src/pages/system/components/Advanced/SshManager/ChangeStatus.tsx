import React, { useState } from "react";
import { api } from "api";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Input from "components/Input";
import Ok from "components/Ok";
import { confirm } from "components/ConfirmDialog";
import { ReqStatus, ShhStatus } from "types";
import "./sshManager.scss";
import { withToastNoThrow } from "components/toast/Toast";

export function SshManagerChangeStatus() {
  const [reqGetStatus, setReqGetStatus] = useState<ReqStatus<ShhStatus>>({});
  const [reqSetStatus, setReqSetStatus] = useState<ReqStatus<ShhStatus>>({});

  async function changeSshStatus(status: ShhStatus) {
    try {
      setReqSetStatus({ loading: true });
      await api.sshStatusSet({ status });
      setReqSetStatus({ result: status });
    } catch (e) {
      setReqSetStatus({ error: e });
      console.error("Error on sshStatusSet", e);
    } finally {
      fetchSshStatus();
    }
  }

  async function fetchSshStatus() {
    try {
      setReqGetStatus({ loading: true });
      const status = await api.sshStatusGet();
      setReqGetStatus({ result: status });
    } catch (e) {
      setReqGetStatus({ error: e });
      console.error("Error on sshStatusGet", e);
    }
  }

  function confirmChangeSsh() {
    confirm({
      title: `Disabling SSH service`,
      text:
        "You will loose SSH access to your DAppNode. Make sure to have an alternative way to access your DAppNode, such as physically with a screen and keyboard before disabling SSH access",
      label: "Disable",
      onClick: () =>
        withToastNoThrow(() => changeSshStatus("disabled"), {
          message: `Disabling SSH...`,
          onSuccess: `Disabled SSH`
        })
    });
  }

  return (
    <>
      <Input
        value={reqGetStatus.result || "?"}
        onValueChange={() => {}}
        prepend="SSH status"
        append={
          <Button disabled={reqGetStatus.loading} onClick={fetchSshStatus}>
            Fetch status
          </Button>
        }
      />

      {reqGetStatus.loading && <Ok loading msg="Fetching SSH status..."></Ok>}
      {reqGetStatus.error && (
        <ErrorView error={reqGetStatus.error} hideIcon red />
      )}

      <div className="ssh-status-manager-buttons">
        <Button
          disabled={reqSetStatus.loading}
          onClick={() => changeSshStatus("enabled")}
        >
          Enable
        </Button>
        <Button
          disabled={reqSetStatus.loading}
          onClick={() => confirmChangeSsh()}
        >
          Disable
        </Button>
      </div>

      {reqSetStatus.loading && <Ok loading msg="Changing SSH status..."></Ok>}
      {reqSetStatus.result && (
        <Ok ok msg={`Successfully ${reqSetStatus.result} SSH`}></Ok>
      )}
      {reqSetStatus.error && (
        <ErrorView error={reqSetStatus.error} hideIcon red />
      )}
    </>
  );
}
