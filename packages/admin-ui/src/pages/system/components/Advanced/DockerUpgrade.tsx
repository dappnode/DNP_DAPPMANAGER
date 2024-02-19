import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import Ok from "components/Ok";
import ErrorView from "components/ErrorView";
import { withToast } from "components/toast/Toast";
import { DockerUpgradeRequirements } from "@dappnode/types";
import { Alert } from "react-bootstrap";
import { gte, lt } from "semver";

function RequirementsList({ items }: { items: DockerUpgradeRequirements }) {
  return (
    <div>
      <Ok
        title="Docker in unattended upgrades"
        msg=""
        ok={items.isDockerInUnattendedUpgrades}
      />
      <Ok
        title="Docker installed through apt"
        msg=""
        ok={items.isDockerInstalledThroughApt}
      />
      <Ok
        title="Docker is updated"
        msg={`Docker host version ${items.dockerHostVersion}, Docker latest version ${items.dockerLatestVersion}`}
        ok={gte(items.dockerHostVersion, items.dockerLatestVersion)}
      />
    </div>
  );
}

export function DockerUpgrade() {
  const [updateReq, setUpdateReq] = useState<ReqStatus>({});
  const [checkReq, setCheckReq] = useState<
    ReqStatus<DockerUpgradeRequirements>
  >({});

  async function dockerUpdateCheck() {
    try {
      setCheckReq({ loading: true });
      const requirements = await api.dockerUpgradeCheck();
      setCheckReq({ result: requirements });
    } catch (e) {
      setCheckReq({ error: e });
      console.error("Error on dockerEngineUpdateCheck", e);
    }
  }

  async function dockerUpdate() {
    try {
      await new Promise<void>(resolve => {
        confirm({
          title: `Docker update`,
          text: `Warning, you are about to update Docker . It is possible that the system will need to reboot. Make sure you can sustain some minutes of downtime and backup your most important packages.`,
          label: "Update",
          onClick: resolve
        });
      });

      setUpdateReq({ loading: true });
      await withToast(() => api.dockerUpgrade(), {
        message: "Updating Docker",
        onSuccess: "Updated Docker"
      });
      setUpdateReq({ result: true });
    } catch (e) {
      setUpdateReq({ error: e });
      console.error("Error on dockerUpdate", e);
    }
  }

  const canUpdate =
    checkReq.result &&
    !checkReq.result.isDockerInUnattendedUpgrades &&
    !checkReq.result.isDockerInstalledThroughApt &&
    lt(checkReq.result.dockerHostVersion, checkReq.result.dockerLatestVersion);

  return (
    <>
      <div className="subtle-header">UPDATE DOCKER ENGINE</div>
      <p>Update docker engine to a stable version with DAppNode</p>

      {!canUpdate && (
        <Button disabled={checkReq.loading} onClick={dockerUpdateCheck}>
          Check update requirements
        </Button>
      )}

      {checkReq.error ? (
        <ErrorView error={checkReq.error} red hideIcon />
      ) : checkReq.loading ? (
        <Ok msg={"Checking update requirements..."} loading={true} />
      ) : null}

      {checkReq.result && (
        <>
          <RequirementsList items={checkReq.result} />

          {canUpdate && (
            <Button disabled={updateReq.loading} onClick={dockerUpdate}>
              Update docker
            </Button>
          )}

          {updateReq.result ? (
            <Ok ok={true} msg={"Successfully updated docker"} />
          ) : updateReq.loading ? (
            <Ok loading={true} msg={"Updating docker"} />
          ) : updateReq.error ? (
            <ErrorView error={updateReq.error} red hideIcon />
          ) : null}
        </>
      )}
    </>
  );
}
