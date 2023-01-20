import React, { useState } from "react";
import { DockerUpdateStatus } from "@dappnode/common";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import ErrorView from "components/ErrorView";
import { withToast } from "components/toast/Toast";
import Alert from "react-bootstrap/esm/Alert";
import { RequirementsList } from "./RequirementsList";
import { ReqStatus } from "types";

export function UpdateDockerCompose() {
  const [checkReq, setCheckReq] = useState<ReqStatus<DockerUpdateStatus>>({});
  const [updateReq, setUpdateReq] = useState<ReqStatus>({});

  async function dockerComposeUpdateCheck() {
    try {
      setCheckReq({ loading: true });
      const requirements = await api.dockerComposeUpdateCheck();
      setCheckReq({ result: requirements });
    } catch (e) {
      setCheckReq({ error: e });
      console.error("Error on dockerComposeUpdateCheck", e);
    }
  }

  async function dockerComposeUpdate() {
    try {
      await new Promise<void>(resolve => {
        confirm({
          title: `Docker compose update`,
          text: `Warning, you are about to update Docker compose. It is possible that the system will need to reboot. Make sure you can sustain some minutes of downtime and backup your most important packages.`,
          label: "Update",
          onClick: resolve
        });
      });

      setUpdateReq({ loading: true });
      await withToast(() => api.dockerComposeUpdate(), {
        message: "Updating Docker compose",
        onSuccess: "Updated Docker compose"
      });
      setUpdateReq({ result: true });
      dockerComposeUpdateCheck();
    } catch (e) {
      setUpdateReq({ error: e });
      console.error("Error on dockerComposeUpdate", e);
    }
  }

  const canUpdate = checkReq.result?.requirements.every(r => r.isFulFilled);

  return (
    <>
      <div className="subtle-header">UPDATE DOCKER COMPOSE</div>
      <p>Update Docker compose to a stable version with DAppNode.</p>

      {!canUpdate && (
        <Button disabled={checkReq.loading} onClick={dockerComposeUpdateCheck}>
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
            <Alert variant="success">Docker compose is updated</Alert>
          ) : !canUpdate ? (
            <Alert variant="danger">Can not update Docker compose</Alert>
          ) : (
            <Button disabled={updateReq.loading} onClick={dockerComposeUpdate}>
              Update docker compose
            </Button>
          )}

          {updateReq.result ? (
            <Ok ok={true} msg={"Successfully updated docker compose"} />
          ) : updateReq.loading ? (
            <Ok loading={true} msg={"Updating docker compose"} />
          ) : updateReq.error ? (
            <ErrorView error={updateReq.error} red hideIcon />
          ) : null}
        </>
      )}
    </>
  );
}
