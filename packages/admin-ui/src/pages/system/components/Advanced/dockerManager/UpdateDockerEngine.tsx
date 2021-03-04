import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";

export function UpdateDockerEngine() {
  const [reqGetEngineVersionStatus, setReqGetEngineVersionStatus] = useState<
    ReqStatus<string>
  >({});
  const [reqUpdateEngineStatus, setReqUpdateEngineStatus] = useState<
    ReqStatus<string>
  >({});

  async function fetchDockerEngineVersion() {
    try {
      setReqGetEngineVersionStatus({ loading: true });
      const version = await api.updateDocker({
        updateOption: "engine -- --version"
      });
      await new Promise<void>(() => {
        confirm({
          title: `Docker update`,
          text: `Warming, you are about to update docker compose. You must be completely sure to perform this action, it is possible that the system reboots. Your current docker version is ${version}`,
          label: "Disable",
          onClick: installDockerEngine
        });
      });
      setReqGetEngineVersionStatus({ result: version });
    } catch (e) {
      setReqGetEngineVersionStatus({ error: e });
      console.error(
        "Error on docker_update.sh script getting engine version",
        e
      );
    }
  }

  async function installDockerEngine() {
    try {
      setReqUpdateEngineStatus({ loading: true });
      const output = await api.updateDocker({
        updateOption: "engine -- --install"
      });
      setReqUpdateEngineStatus({ result: output });
    } catch (e) {
      setReqUpdateEngineStatus({ error: e });
      console.error(
        "Error on docker_update.sh script updating engine version",
        e
      );
    }
  }
  return (
    <>
      <Button
        disabled={
          reqGetEngineVersionStatus.loading || reqUpdateEngineStatus.loading
        }
        onClick={fetchDockerEngineVersion}
      >
        Update docker Engine
      </Button>
      {reqUpdateEngineStatus.result ? (
        <Ok ok={true} msg={reqUpdateEngineStatus.result} />
      ) : reqUpdateEngineStatus.error ? (
        <ErrorView
          error={reqUpdateEngineStatus.error}
          red={true}
          hideIcon={true}
        />
      ) : reqUpdateEngineStatus.loading ? (
        <Ok msg={"Updating docker engine..."} loading={true} />
      ) : null}
      {reqGetEngineVersionStatus.result ? (
        <Ok
          ok={true}
          msg={`Docker engine version: ${reqGetEngineVersionStatus.result}`}
        />
      ) : reqGetEngineVersionStatus.error ? (
        <ErrorView
          error={reqGetEngineVersionStatus.error}
          red={true}
          hideIcon={true}
        />
      ) : reqGetEngineVersionStatus.loading ? (
        <Ok msg={"Fetching docker engine version..."} loading={true} />
      ) : null}
    </>
  );
}
