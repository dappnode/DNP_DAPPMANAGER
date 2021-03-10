import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import { DockerEngineUpdateRequirements } from "common";
import { params } from "./params";

import "./dockerManager.scss";

function UpdateDockerEngine({
  updateEngineRequirements
}: {
  updateEngineRequirements: DockerEngineUpdateRequirements;
}) {
  const [reqUpdateEngineStatus, setReqUpdateEngineStatus] = useState<
    ReqStatus<string>
  >({});

  async function installDockerEngine() {
    try {
      setReqUpdateEngineStatus({ loading: true });
      await new Promise<void>(resolve => {
        confirm({
          title: `Docker engine update`,
          text: `Warming, you are about to update docker engine. You must be completely sure to perform this action, it is possible that the system reboots.`,
          label: "Update",
          onClick: () => resolve
        });
      });
      const output = await api.dockerEngineUpdate();
      setReqUpdateEngineStatus({ result: output });
    } catch (e) {
      setReqUpdateEngineStatus({ error: e });
      console.error(`Error on docker_engine_update.sh script: --install`, e);
    }
  }

  return (
    <>
      <div className="checkbox-docker-engine-update">
        <input
          type="checkbox"
          readOnly={true}
          checked={updateEngineRequirements.isArchitecture}
        >
          {`Architecture: ${updateEngineRequirements.hostInfo.architecture}` +
          !updateEngineRequirements.isArchitecture
            ? `Architecture must be ${params.ARCHITECTURE.join(",")}`
            : ""}
        </input>
        <input
          type="checkbox"
          readOnly={true}
          checked={updateEngineRequirements.isOs}
        >
          {`Os: ${updateEngineRequirements.hostInfo.os}` +
          !updateEngineRequirements.isOs
            ? `OS must be ${params.OS.join(",")}`
            : ""}
        </input>
        <input
          type="checkbox"
          readOnly={true}
          checked={updateEngineRequirements.isOsVersion}
        >
          {`Version: ${updateEngineRequirements.hostInfo.versionCodename}` +
          !updateEngineRequirements.isOsVersion
            ? `Version must be ${params.VERSION_CODENAME.join(",")}`
            : ""}
        </input>
        <input
          readOnly={true}
          type="checkbox"
          checked={updateEngineRequirements.isDockerEngineUpgrade}
        >
          {`Current docker version: ${updateEngineRequirements.hostInfo.dockerServerVersion}` +
          !updateEngineRequirements.isDockerEngineUpgrade
            ? `Downgrade is not allowed`
            : ""}
        </input>
        <input
          readOnly={true}
          type="checkbox"
          checked={updateEngineRequirements.isDockerSynchronized}
        >
          {`Docker CLI and server versions synchrnonized`}
        </input>
        <input
          readOnly={true}
          type="checkbox"
          checked={updateEngineRequirements.isDockerEngineUpdateCompatible}
        >
          {`Versions compatibility`}
        </input>
      </div>

      {updateEngineRequirements.isArchitecture &&
      updateEngineRequirements.isOs &&
      updateEngineRequirements.isOsVersion &&
      updateEngineRequirements.isDockerEngineUpgrade &&
      updateEngineRequirements.isDockerSynchronized &&
      updateEngineRequirements.isDockerEngineUpdateCompatible ? (
        <Button
          disabled={
            reqUpdateEngineStatus.loading ||
            reqUpdateEngineStatus.result !== undefined
          }
          onClick={() => installDockerEngine()}
        >
          Update docker engine
        </Button>
      ) : (
        <Ok
          ok={false}
          msg={
            "Docker engine update not allowed. You must fullfill the requirements"
          }
        />
      )}
      {reqUpdateEngineStatus.result ? (
        <Ok ok={true} msg={"Successfully updated docker engine"} />
      ) : reqUpdateEngineStatus.loading ? (
        <Ok loading={true} msg={"Updating docker engine"} />
      ) : reqUpdateEngineStatus.error ? (
        <Ok
          ok={false}
          msg={
            reqUpdateEngineStatus.error instanceof Error
              ? reqUpdateEngineStatus.error.message
              : reqUpdateEngineStatus.error
          }
        />
      ) : null}
    </>
  );
}

export default function DockerEngineManager() {
  const [
    reqGetEngineUpdateRequirements,
    setReqGetEngineUpdateRequirements
  ] = useState<ReqStatus<DockerEngineUpdateRequirements>>({});

  async function fetchEngineUpdateRequirements() {
    try {
      setReqGetEngineUpdateRequirements({ loading: true });
      const requirements = await api.dockerEngineUpdateRequirements();
      setReqGetEngineUpdateRequirements({ result: requirements });
    } catch (e) {
      setReqGetEngineUpdateRequirements({ error: e });
      console.error(`Error on docker_engine_update.sh script: --system`, e);
    }
  }

  return (
    <>
      <div className="subtle-header">UPDATE DOCKER ENGINE</div>
      <p>
        Update docker engine to a stable version with DAppNode. You must fulfill
        a series of requirements
      </p>
      <Button
        disabled={
          reqGetEngineUpdateRequirements.loading ||
          reqGetEngineUpdateRequirements.result !== undefined
        }
        onClick={() => fetchEngineUpdateRequirements()}
      >
        Check requirements
      </Button>
      {reqGetEngineUpdateRequirements.result ? (
        <UpdateDockerEngine
          updateEngineRequirements={reqGetEngineUpdateRequirements.result}
        />
      ) : reqGetEngineUpdateRequirements.error ? (
        <Ok
          msg={
            reqGetEngineUpdateRequirements.error instanceof Error
              ? reqGetEngineUpdateRequirements.error.message
              : reqGetEngineUpdateRequirements.error
          }
          ok={false}
        />
      ) : reqGetEngineUpdateRequirements.loading ? (
        <Ok msg={"Checking host requirements..."} loading={true} />
      ) : null}
    </>
  );
}
