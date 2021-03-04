import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
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
      setReqGetEngineVersionStatus({ result: version });
      await new Promise<void>(() => {
        confirm({
          title: `Docker update`,
          text: `Warming, you are about to update docker compose. You must be completely sure to perform this action, it is possible that the system reboots. Your current docker version is ${version}`,
          label: "Update",
          onClick: installDockerEngine
        });
      });
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
        <Ok
          msg={
            reqUpdateEngineStatus.error instanceof Error
              ? reqUpdateEngineStatus.error.message
              : reqUpdateEngineStatus.error
          }
          ok={false}
        />
      ) : reqUpdateEngineStatus.loading ? (
        <Ok msg={"Updating docker engine..."} loading={true} />
      ) : null}
      {reqGetEngineVersionStatus.result ? (
        <p>
          Docker engine version:
          <strong>{reqGetEngineVersionStatus.result}</strong>
        </p>
      ) : reqGetEngineVersionStatus.error ? (
        <Ok
          msg={
            reqGetEngineVersionStatus.error instanceof Error
              ? reqGetEngineVersionStatus.error.message
              : reqGetEngineVersionStatus.error
          }
          ok={false}
        />
      ) : reqGetEngineVersionStatus.loading ? (
        <Ok msg={"Fetching docker engine version..."} loading={true} />
      ) : null}
    </>
  );
}
