import React, { useState } from "react";
import { DockerComposeUpdateRequirements, ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import "./dockerManager.scss";

function UpdateDockerCompose({
  composeUpdateRequirements
}: {
  composeUpdateRequirements: DockerComposeUpdateRequirements;
}) {
  const [reqUpdateComposeStatus, setReqUpdateComposeStatus] = useState<
    ReqStatus<string>
  >({});

  async function installDockerCompose() {
    try {
      setReqUpdateComposeStatus({ loading: true });
      await new Promise<void>(resolve => {
        confirm({
          title: `Docker compose update`,
          text: `Warming, you are about to update docker compose. You must be completely sure to perform this action, it is possible that the system reboots.`,
          label: "Update",
          onClick: () => resolve
        });
      });
      const output = await api.dockerComposeUpdate();
      setReqUpdateComposeStatus({ result: output });
    } catch (e) {
      setReqUpdateComposeStatus({ error: e });
      console.error(`Error on docker_compose_update.sh script: --install`, e);
    }
  }

  return (
    <>
      <div className="checkbox-docker-compose-update">
        <input
          id="isUpgrade"
          readOnly={true}
          type="checkbox"
          checked={composeUpdateRequirements.isDockerComposeUpgrade}
        ></input>
        <label htmlFor={"test"}>
          {`Current compose version: ${composeUpdateRequirements.dockerComposeVersion}` +
          !composeUpdateRequirements.isDockerComposeUpgrade
            ? `Downgrade is not allowed`
            : ""}
        </label>
      </div>
      {composeUpdateRequirements.isDockerComposeUpgrade ? (
        <Button
          disabled={
            reqUpdateComposeStatus.loading ||
            reqUpdateComposeStatus.result !== undefined
          }
          onClick={() => installDockerCompose()}
        >
          Update docker compose
        </Button>
      ) : (
        <Ok
          ok={false}
          msg={
            "Docker compose update not allowed. You must fullfill the requirements"
          }
        />
      )}
      {reqUpdateComposeStatus.result ? (
        <Ok ok={true} msg={"Successfully updated docker compose"} />
      ) : reqUpdateComposeStatus.loading ? (
        <Ok loading={true} msg={"Updating docker compose"} />
      ) : reqUpdateComposeStatus.error ? (
        <Ok
          ok={false}
          msg={
            reqUpdateComposeStatus.error instanceof Error
              ? reqUpdateComposeStatus.error.message
              : reqUpdateComposeStatus.error
          }
        />
      ) : null}
    </>
  );
}

export default function DockerComposeManager() {
  // Docker compose
  const [reqGetComposeVersionStatus, setReqGetComposeVersionStatus] = useState<
    ReqStatus<DockerComposeUpdateRequirements>
  >({});

  async function fetchDockerComposeVersion() {
    try {
      setReqGetComposeVersionStatus({ loading: true });
      const version = await api.dockerComposeUpdateRequirements();
      setReqGetComposeVersionStatus({ result: version });
    } catch (e) {
      setReqGetComposeVersionStatus({ error: e });
      console.error(`Error on docker_compose_update.sh script: --version`, e);
    }
  }

  return (
    <>
      <div className="subtle-header">UPDATE DOCKER COMPOSE</div>
      <p>
        Update docker engine to a stable version with DAppNode. You must fulfill
        a series of requirements
      </p>
      <br />
      <Button
        disabled={
          reqGetComposeVersionStatus.loading ||
          reqGetComposeVersionStatus.result !== undefined
        }
        onClick={() => fetchDockerComposeVersion()}
      >
        Check requirements
      </Button>
      {reqGetComposeVersionStatus.result ? (
        <UpdateDockerCompose
          composeUpdateRequirements={reqGetComposeVersionStatus.result}
        />
      ) : reqGetComposeVersionStatus.error ? (
        <Ok
          msg={
            reqGetComposeVersionStatus.error instanceof Error
              ? reqGetComposeVersionStatus.error.message
              : reqGetComposeVersionStatus.error
          }
          ok={false}
        />
      ) : reqGetComposeVersionStatus.loading ? (
        <Ok msg={"Checking host requirements..."} loading={true} />
      ) : null}
    </>
  );
}
