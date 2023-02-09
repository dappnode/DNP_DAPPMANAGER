import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import { DockerUpdateStatus } from "@dappnode/common";
import ErrorView from "components/ErrorView";
import { withToast } from "components/toast/Toast";
import Alert from "react-bootstrap/esm/Alert";
import { RequirementsList } from "./RequirementsList";

export function UpdateDockerEngine() {
  const [checkReq, setCheckReq] = useState<ReqStatus<DockerUpdateStatus>>({});
  const [updateReq, setUpdateReq] = useState<ReqStatus>({});

  async function dockerEngineUpdateCheck() {
    try {
      setCheckReq({ loading: true });
      const requirements = await api.dockerEngineUpdateCheck();
      setCheckReq({ result: requirements });
    } catch (e) {
      setCheckReq({ error: e });
      console.error("Error on dockerEngineUpdateCheck", e);
    }
  }

  async function dockerEngineUpdate() {
    try {
      await new Promise<void>(resolve => {
        confirm({
          title: `Docker engine update`,
          text: `Warning, you are about to update Docker engine. It is possible that the system will need to reboot. Make sure you can sustain some minutes of downtime and backup your most important packages.`,
          label: "Update",
          onClick: resolve
        });
      });

      setUpdateReq({ loading: true });
      await withToast(() => api.dockerEngineUpdate(), {
        message: "Updating Docker engine",
        onSuccess: "Updated Docker engine"
      });
      setUpdateReq({ result: true });
      dockerEngineUpdateCheck();
    } catch (e) {
      setUpdateReq({ error: e });
      console.error("Error on dockerEngineUpdate", e);
    }
  }

  const canUpdate = checkReq.result?.requirements.every(r => r.isFulFilled);

  return (
    <>
      <div className="subtle-header">UPDATE DOCKER ENGINE</div>
      <p>
        Update docker engine to a stable version with DAppNode. You must update
        Docker compose first, then Docker engine
      </p>

      {!canUpdate && (
        <Button disabled={checkReq.loading} onClick={dockerEngineUpdateCheck}>
          Check requirements
        </Button>
      )}

      {checkReq.error ? (
        <ErrorView error={checkReq.error} red hideIcon />
      ) : checkReq.loading ? (
        <Ok msg={"Checking update requirements..."} loading={true} />
      ) : null}

      {checkReq.result && (
        <>
          <RequirementsList items={checkReq.result.requirements} />

          {checkReq.result.updated ? (
            <Alert variant="success">Docker engine is updated</Alert>
          ) : !canUpdate ? (
            <Alert variant="danger">Can not update Docker engine</Alert>
          ) : (
            <Button disabled={updateReq.loading} onClick={dockerEngineUpdate}>
              Update docker engine
            </Button>
          )}

          {updateReq.result ? (
            <Ok ok={true} msg={"Successfully updated docker engine"} />
          ) : updateReq.loading ? (
            <Ok loading={true} msg={"Updating docker engine"} />
          ) : updateReq.error ? (
            <ErrorView error={updateReq.error} red hideIcon />
          ) : null}
        </>
      )}
    </>
  );
}
