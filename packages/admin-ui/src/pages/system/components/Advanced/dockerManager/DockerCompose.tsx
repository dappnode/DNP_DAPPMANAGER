import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import { getIsDockerComposeUpgrade } from "./params";

function UpdateDockerCompose({
  dockerComposeVersion
}: {
  dockerComposeVersion: string;
}) {
  const [reqUpdateComposeStatus, setReqUpdateComposeStatus] = useState<
    ReqStatus<string>
  >({});

  // Requirements
  const isDockerComposeUpgrade = getIsDockerComposeUpgrade(
    dockerComposeVersion
  );

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
      const output = await api.updateDocker({
        updateOption: "compose -- --install"
      });
      setReqUpdateComposeStatus({ result: output });
    } catch (e) {
      setReqUpdateComposeStatus({ error: e });
      console.error(
        `Error on docker_update.sh script (compose -- --install) updating docker Compose`,
        e
      );
    }
  }

  return (
    <>
      <Ok
        ok={isDockerComposeUpgrade}
        msg={
          `Current compose version: ${dockerComposeVersion}` +
          !isDockerComposeUpgrade
            ? `Downgrade is not allowed`
            : ""
        }
      />
      {isDockerComposeUpgrade ? (
        <Button
          disabled={
            reqUpdateComposeStatus.loading ||
            reqUpdateComposeStatus.result !== undefined
          }
          onClick={() => installDockerCompose()}
        >
          Update docker compose
        </Button>
      ) : null}
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
    ReqStatus<string>
  >({});

  async function fetchDockerComposeVersion() {
    try {
      setReqGetComposeVersionStatus({ loading: true });
      const version = await api.getDockerVersion({
        versionOption: `compose -- --version`
      });
      setReqGetComposeVersionStatus({ result: version });
    } catch (e) {
      setReqGetComposeVersionStatus({ error: e });
      console.error(
        `Error on docker_update.sh script (compose -- --version) getting docker compose version`,
        e
      );
    }
  }

  return (
    <>
      <div className="subtle-header">UPDATE DOCKER COMPOSE</div>
      <p>
        Update docker engine to a stable version with DAppNode. You must fulfill
        a series of requirements
      </p>
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
          dockerComposeVersion={reqGetComposeVersionStatus.result}
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
