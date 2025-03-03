import React, { useEffect, useState } from "react";
import { api } from "api";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { confirm } from "components/ConfirmDialog";
import { ReqStatus } from "types";
import { withToast } from "components/toast/Toast";
import { ShhStatus } from "@dappnode/types";
import Switch from "components/Switch";
import "./sshManager.scss";

interface SshManagerChangeStatusProps {
  reqGetStatus: ReqStatus<ShhStatus>;
  setReqGetStatus: (reqGetStatus: ReqStatus<ShhStatus>) => void;
}

export function SshManagerChangeStatus({ reqGetStatus, setReqGetStatus }: SshManagerChangeStatusProps) {
  const [reqSetStatus, setReqSetStatus] = useState<ReqStatus<ShhStatus>>({});

  useEffect(() => {
    fetchSshStatus();
  }, []);

  async function changeSshStatus(status: ShhStatus) {
    if (status === "disabled") {
      await new Promise<void>((resolve) => {
        confirm({
          title: `Disabling SSH service`,
          text:
            "Warning, you will loose SSH access to your DAppNode. Having direct access to your host machine may be necessary to fix bugs. Make sure to have an alternative way to access your DAppNode, such as physically with a screen and keyboard before disabling SSH access",
          label: "Disable",
          onClick: resolve
        });
      });
    }

    try {
      setReqSetStatus({ loading: true });
      await withToast(() => api.sshStatusSet({ status }), {
        message: `${status === "enabled" ? "Enabling" : "Disabling"} SSH...`,
        onSuccess: `${status === "enabled" ? "Enabled" : "Disabled"} SSH...`
      });
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

  const handleToggle = () => {
    if (reqGetStatus.result === "enabled") {
      changeSshStatus("disabled");
    } else {
      changeSshStatus("enabled");
    }
  };
  console.log(reqGetStatus.result);
  return (
    <>
      <div className="section-wrapper">
        <div className="subtle-header">ENABLE, DISABLE SSH</div>
        <Switch checked={reqGetStatus.result === "enabled"} onToggle={handleToggle} disabled={reqGetStatus.loading} />
      </div>

      {reqGetStatus.loading && <Ok loading msg="Fetching SSH status..."></Ok>}
      {reqGetStatus.error && <ErrorView error={reqGetStatus.error} hideIcon red />}

      {reqSetStatus.loading && <Ok loading msg="Changing SSH status..."></Ok>}
      {reqSetStatus.result && <Ok ok msg={`Successfully ${reqSetStatus.result} SSH`}></Ok>}
      {reqSetStatus.error && <ErrorView error={reqSetStatus.error} hideIcon red />}
    </>
  );
}
