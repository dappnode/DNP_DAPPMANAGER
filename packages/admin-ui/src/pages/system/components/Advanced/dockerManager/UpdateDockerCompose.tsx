import React, { useState } from "react";
import { confirm } from "components/ConfirmDialog";
import { ReqStatus } from "types";
import { api } from "api";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
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
          label: "Disable",
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
        <ErrorView
          error={reqUpdateComposeStatus.error}
          red={true}
          hideIcon={true}
        />
      ) : reqUpdateComposeStatus.loading ? (
        <Ok msg={"Updating docker compose..."} loading={true} />
      ) : null}
      {reqGetComposeVersionStatus.result ? (
        <Ok
          ok={true}
          msg={`Docker compose version: ${reqGetComposeVersionStatus.result}`}
        />
      ) : reqGetComposeVersionStatus.error ? (
        <ErrorView
          error={reqGetComposeVersionStatus.error}
          red={true}
          hideIcon={true}
        />
      ) : reqGetComposeVersionStatus.loading ? (
        <Ok msg={"Fetching docker compose version..."} loading={true} />
      ) : null}
    </>
  );
}
