import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import Ok from "components/Ok";
import Button from "components/Button";
import ErrorView from "components/ErrorView";

export default function HostUpdate() {
  const [updateReq, setUpdateReq] = useState<ReqStatus<string>>({});

  async function hostUpdate() {
    try {
      await new Promise<void>(resolve => {
        confirm({
          title: `Host update`,
          text: `Warning, you are about to perform host updates. It is possible that the system will need to reboot.`,
          label: "Host update",
          onClick: resolve
        });
      });
      setUpdateReq({ loading: true });
      const result = await withToast(() => api.runHostUpdates(), {
        message: "Performing host updates",
        onSuccess: "Performed host updates"
      });
      setUpdateReq({ result: result });
    } catch (e) {
      setUpdateReq({ error: e });
      console.error("Error on hostUpdates", e);
    }
  }
  return (
    <>
      <p>
        Keep your host updated by performing host updates of outdated libraries
        and the kernel
      </p>

      <Button disabled={updateReq.loading} onClick={hostUpdate}>
        Host updates
      </Button>

      {updateReq.result ? (
        <Ok ok={true} msg={"Successfully perform host updates"} />
      ) : updateReq.error ? (
        <ErrorView error={updateReq.error} red hideIcon />
      ) : updateReq.loading ? (
        <Ok msg={"Performing host updates..."} loading={true} />
      ) : null}
    </>
  );
}
