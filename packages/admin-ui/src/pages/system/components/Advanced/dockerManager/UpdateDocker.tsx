import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import { DockerScriptOptions } from "common";

export default function UpdateDocker() {
  // Docker engine
  const [reqGetEngineVersionStatus, setReqGetEngineVersionStatus] = useState<
    ReqStatus<string>
  >({});
  const [reqUpdateEngineStatus, setReqUpdateEngineStatus] = useState<
    ReqStatus<string>
  >({});

  // Docker compose
  const [reqGetComposeVersionStatus, setReqGetComposeVersionStatus] = useState<
    ReqStatus<string>
  >({});
  const [reqUpdateComposeStatus, setReqUpdateComposeStatus] = useState<
    ReqStatus<string>
  >({});

  async function fetchDockerVersion(option: "engine" | "compose") {
    try {
      if (option === "compose")
        setReqGetComposeVersionStatus({ loading: true });
      if (option === "engine") setReqGetEngineVersionStatus({ loading: true });
      const version = await api.updateDocker({
        updateOption: `${option} -- --version` as DockerScriptOptions
      });
      if (option === "compose")
        setReqGetComposeVersionStatus({ result: version });
      if (option === "engine")
        setReqGetEngineVersionStatus({ result: version });

      await new Promise<void>(() => {
        confirm({
          title: `Docker compose update`,
          text: `Warming, you are about to update docker engine. You must be completely sure to perform this action, it is possible that the system reboots. Your current docker compose version is ${version}`,
          label: "Update",
          onClick: () => installDocker(option)
        });
      });
    } catch (e) {
      if (option === "engine") setReqGetEngineVersionStatus({ error: e });
      if (option === "compose") setReqGetComposeVersionStatus({ error: e });
      console.error(
        `Error on docker_update.sh script getting docker ${option}  version`,
        e
      );
    }
  }

  async function installDocker(option: "engine" | "compose") {
    try {
      if (option === "engine") setReqUpdateEngineStatus({ loading: true });
      if (option === "compose") setReqUpdateComposeStatus({ loading: true });
      const output = await api.updateDocker({
        updateOption: `${option} -- --install` as DockerScriptOptions
      });
      if (option === "engine") setReqUpdateEngineStatus({ result: output });
      if (option === "compose") setReqUpdateComposeStatus({ result: output });
    } catch (e) {
      if (option === "compose") setReqUpdateComposeStatus({ error: e });
      if (option === "engine") setReqUpdateEngineStatus({ error: e });
      console.error(
        `Error on docker_update.sh script updating docker ${option} version`,
        e
      );
    }
  }

  return (
    <>
      <div className="subtle-header">UPDATE DOCKER ENGINE</div>
      <p>Update docker engine to a stable version with DAppNode.</p>
      <Button
        disabled={
          reqGetComposeVersionStatus.loading ||
          reqUpdateComposeStatus.loading ||
          reqGetEngineVersionStatus.loading ||
          reqUpdateEngineStatus.loading
        }
        onClick={() => fetchDockerVersion("compose")}
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

      <hr />

      <div className="subtle-header">UPDATE DOCKER COMPOSE</div>
      <p>
        Update docker compose to a stable version with DAppNode (recommended).
      </p>
      <Button
        disabled={
          reqGetComposeVersionStatus.loading ||
          reqUpdateComposeStatus.loading ||
          reqGetEngineVersionStatus.loading ||
          reqUpdateEngineStatus.loading
        }
        onClick={() => fetchDockerVersion("engine")}
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
