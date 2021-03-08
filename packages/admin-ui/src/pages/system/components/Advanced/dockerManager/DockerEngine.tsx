import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import { HostInfoScript } from "common";
import { params } from "./params";
import {
  getIsArchitecture,
  getIsOs,
  getIsOsVersion,
  getIsDockerEngineUpgrade,
  getIsDockerSynchronized
} from "./params";

function UpdateDockerEngine({ hostInfo }: { hostInfo: HostInfoScript }) {
  const [reqUpdateEngineStatus, setReqUpdateEngineStatus] = useState<
    ReqStatus<string>
  >({});

  // Requirements
  const isArchitecture = getIsArchitecture(hostInfo.architecture);
  const isOs = getIsOs(hostInfo.os);
  const isOsVersion = getIsOsVersion(hostInfo.versionCodename);
  const isUpgrade = getIsDockerEngineUpgrade(
    hostInfo.versionCodename,
    hostInfo.dockerServerVersion
  );
  const isDockerSynchronized = getIsDockerSynchronized(
    hostInfo.dockerServerVersion,
    hostInfo.dockerCliVersion
  );

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
      const output = await api.updateDocker({
        updateOption: "engine -- --install"
      });
      setReqUpdateEngineStatus({ result: output });
    } catch (e) {
      setReqUpdateEngineStatus({ error: e });
      console.error(
        `Error on docker_update.sh script (engine -- --install) updating docker engine`,
        e
      );
    }
  }

  return (
    <>
      <Ok
        ok={isArchitecture}
        msg={
          `Architecture: ${hostInfo.architecture}` + !isArchitecture
            ? `Architecture must be ${params.ARCHITECTURE.join(",")}`
            : ""
        }
      />
      <Ok
        ok={isOs}
        msg={
          `Os: ${hostInfo.os}` + !isOs
            ? `OS must be ${params.OS.join(",")}`
            : ""
        }
      />
      <Ok
        ok={isOsVersion}
        msg={
          `Version: ${hostInfo.versionCodename}` + !isOsVersion
            ? `Version must be ${params.VERSION_CODENAME.join(",")}`
            : ""
        }
      />
      <Ok
        ok={isUpgrade}
        msg={
          `Current docker version: ${hostInfo.dockerServerVersion}` + !isUpgrade
            ? `Downgrade is not allowed`
            : ""
        }
      />
      <Ok
        ok={isDockerSynchronized}
        msg={
          `Docker CLI and server versions synchrnonized: ${isDockerSynchronized}` +
          !isOsVersion
            ? `Docker CLI and server versions must be equal`
            : ""
        }
      />
      {isArchitecture &&
      isOs &&
      isOsVersion &&
      isUpgrade &&
      isDockerSynchronized ? (
        <Button
          disabled={
            reqUpdateEngineStatus.loading ||
            reqUpdateEngineStatus.result !== undefined
          }
          onClick={() => installDockerEngine()}
        >
          Update docker engine
        </Button>
      ) : null}
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
  const [reqGetHostInfoStatus, setReqGetHostInfoStatus] = useState<
    ReqStatus<HostInfoScript>
  >({});

  async function fetchHostInfo() {
    try {
      setReqGetHostInfoStatus({ loading: true });
      const hostInfo = await api.getHostInfo({
        option: "system"
      });
      setReqGetHostInfoStatus({ result: hostInfo });
    } catch (e) {
      // Docker engine
      setReqGetHostInfoStatus({ error: e });
      console.error(
        `Error on docker_update.sh script (system option) getting host info`,
        e
      );
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
          reqGetHostInfoStatus.loading ||
          reqGetHostInfoStatus.result !== undefined
        }
        onClick={() => fetchHostInfo()}
      >
        Check requirements
      </Button>
      {reqGetHostInfoStatus.result ? (
        <UpdateDockerEngine hostInfo={reqGetHostInfoStatus.result} />
      ) : reqGetHostInfoStatus.error ? (
        <Ok
          msg={
            reqGetHostInfoStatus.error instanceof Error
              ? reqGetHostInfoStatus.error.message
              : reqGetHostInfoStatus.error
          }
          ok={false}
        />
      ) : reqGetHostInfoStatus.loading ? (
        <Ok msg={"Checking host requirements..."} loading={true} />
      ) : null}
    </>
  );
}
