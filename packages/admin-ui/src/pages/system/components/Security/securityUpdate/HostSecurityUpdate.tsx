import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import Ok from "components/Ok";
import Button from "components/Button";
import ErrorView from "components/ErrorView";

export default function HostSecurityUpdate() {
  const [updateReq, setUpdateReq] = useState<ReqStatus<string>>({});

  async function hostSecurityUpdate() {
    try {
      await new Promise<void>(resolve => {
        confirm({
          title: `Host security update`,
          text: `Warming, you are about to perform host security updates. It is possible that the system will need to reboot.`,
          label: "Security update",
          onClick: resolve
        });
      });
      setUpdateReq({ loading: true });
      const result = await withToast(() => api.updateSecurity(), {
        message: "Performing security updates",
        onSuccess: "Performed security updates"
      });
      setUpdateReq({ result: result });
    } catch (e) {
      setUpdateReq({ error: e });
      console.error("Error on securityUpdate", e);
    }
  }
  return (
    <>
      <p>
        Keep your host updated by performing security updates of outdated
        libraries and the kernel
      </p>

      <Button disabled={updateReq.loading} onClick={hostSecurityUpdate}>
        Security updates
      </Button>

      {updateReq.result ? (
        <Ok ok={true} msg={"Successfully perform security updates"} />
      ) : updateReq.error ? (
        <ErrorView error={updateReq.error} red hideIcon />
      ) : updateReq.loading ? (
        <Ok msg={"Performing security updates..."} loading={true} />
      ) : null}
    </>
  );
}
