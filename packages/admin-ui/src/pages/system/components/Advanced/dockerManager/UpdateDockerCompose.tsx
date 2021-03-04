import React, { useState } from "react";
import { confirm } from "components/ConfirmDialog";
import { ReqStatus } from "types";
import { api } from "api";
import Button from "components/Button";
import Ok from "components/Ok";

export function UpdateDockerCompose() {
  const [reqGetComposeVersionStatus, setReqGetComposeVersionStatus] = useState<
    ReqStatus<string>
  >({});
  const [reqUpdateComposeStatus, setReqUpdateComposeStatus] = useState<
    ReqStatus<string>
  >({});

  async function fetchDockerComposeVersion() {
    try {
      setReqGetComposeVersionStatus({ loading: true });
      const version = await api.updateDocker({
        updateOption: "compose -- --version"
      });
      setReqGetComposeVersionStatus({ result: version });
      await new Promise<void>(() => {
        confirm({
          title: `Docker compose update`,
          text: `Warming, you are about to update docker engine. You must be completely sure to perform this action, it is possible that the system reboots. Your current docker compose version is ${version}`,
          label: "Update",
          onClick: installDockerCompose
        });
      });
    } catch (e) {
      setReqGetComposeVersionStatus({ error: e });
      console.error(
        "Error on docker_update.sh script getting compose version",
        e
      );
    }
  }

  async function installDockerCompose() {
    try {
      setReqUpdateComposeStatus({ loading: true });
      const output = await api.updateDocker({
        updateOption: "compose -- --install"
      });
      setReqUpdateComposeStatus({ result: output });
    } catch (e) {
      setReqUpdateComposeStatus({ error: e });
      console.error(
        "Error on docker_update.sh script updating compose version",
        e
      );
    }
  }

  return (
    <>
      <Button
        disabled={
          reqGetComposeVersionStatus.loading || reqUpdateComposeStatus.loading
        }
        onClick={fetchDockerComposeVersion}
      >
        Update docker compose
      </Button>
      {reqUpdateComposeStatus.result ? (
        <Ok ok={true} msg={reqUpdateComposeStatus.result} />
      ) : reqUpdateComposeStatus.error ? (
        <Ok
          msg={
            reqUpdateComposeStatus.error instanceof Error
              ? reqUpdateComposeStatus.error.message
              : reqUpdateComposeStatus.error
          }
          ok={false}
        />
      ) : reqUpdateComposeStatus.loading ? (
        <Ok msg={"Updating docker compose..."} loading={true} />
      ) : null}
      {reqGetComposeVersionStatus.result ? (
        <p>
          Docker compose version:
          <strong>{reqGetComposeVersionStatus.result}</strong>
        </p>
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
        <Ok msg={"Fetching docker compose version..."} loading={true} />
      ) : null}
    </>
  );
}
