import React, { useState, useEffect } from "react";
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
import Card from "components/Card";

function RequirementsList({ items }: { items: DockerUpgradeRequirements }) {
  return (
    <div>
      <Ok
        title="Docker in unattended upgrades"
        msg="Docker is in the unattended upgrades list. This means that it will be automatically updated by the system"
        ok={items.isDockerInUnattendedUpgrades}
      />
      <Ok
        title="Docker installed through apt"
        msg="docker has been installed through the apt package manager. This is the recommended way to install docker in DAppNode so it can be automatically updated by unattended upgrades"
        ok={items.isDockerInstalledThroughApt}
      />
      <Ok
        title="Docker is updated"
        msg={
          items.isDockerInstalledThroughApt
            ? `Docker host version ${items.dockerHostVersion}, Docker latest version ${items.dockerLatestVersion}`
            : `Could not be determined the latest docker version available because docker is not installed through apt`
        }
        ok={
          items.isDockerInstalledThroughApt && items.dockerLatestVersion
            ? gte(items.dockerHostVersion, items.dockerLatestVersion)
            : false
        }
      />
    </div>
  );
}

export function DockerUpgrade() {
  const [updateReq, setUpdateReq] = useState<ReqStatus>({});
  const [checkReq, setCheckReq] = useState<
    ReqStatus<DockerUpgradeRequirements>
  >({});
  const [canUpdate, setCanUpdate] = useState<boolean>(false);

  useEffect(() => {
    if (checkReq.result) {
      const {
        isDockerInUnattendedUpgrades,
        isDockerInstalledThroughApt,
        dockerHostVersion,
        dockerLatestVersion
      } = checkReq.result;
      const canUpdate =
        !isDockerInUnattendedUpgrades ||
        !isDockerInstalledThroughApt ||
        (Boolean(dockerLatestVersion) && // docker latest version might be empty if docker is not installed through apt
          lt(dockerHostVersion, dockerLatestVersion));
      setCanUpdate(canUpdate);
    }
  }, [checkReq.result]);

  async function dockerUpdateCheck() {
    try {
      setCheckReq({ loading: true });
      const requirements = await api.dockerUpgradeCheck();
      setCheckReq({ result: requirements });
    } catch (e) {
      setCheckReq({ error: e });
      console.error("Error on dockerUpdateCheck", e);
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

  return (
    <Card spacing>
      <p>
        Update docker to latest version, make sure its installed through the
        standard apt package manager and enable unattended upgrades for docker
        so you do not worry about updating docker anymore
      </p>

      {!canUpdate ? (
        <Button disabled={checkReq.loading} onClick={dockerUpdateCheck}>
          Check update requirements
        </Button>
      ) : (
        <Alert variant="success">
          Docker is updated and in unattended upgrades and installed through apt
        </Alert>
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
    </Card>
  );
}
