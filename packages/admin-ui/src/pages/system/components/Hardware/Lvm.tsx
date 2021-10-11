import React, { useState } from "react";
import { ReqStatus } from "types";
import { api } from "api";
import Button from "components/Button";
import Ok from "components/Ok";
import ErrorView from "components/ErrorView";
import Select from "components/Select";
import Card from "components/Card";

export default function Lvm() {
  const [start, setStart] = useState(false);
  // Requests
  const [diskReq, setDiskReq] = useState<ReqStatus<string[]>>({});
  const [volumeGroupReq, setVolumeGroupReq] = useState<ReqStatus<string[]>>({});
  const [logicalVolumeReq, setLogicalVolumeReq] = useState<ReqStatus<string[]>>(
    {}
  );
  const [expandDiskReq, setExpandDiskReq] = useState<ReqStatus<string>>({});

  // Select options
  const [disk, setDisk] = useState("");
  const [volumeGroup, setVolumeGroup] = useState("");
  const [logicalVolume, setLogicalVolume] = useState("");

  async function getDisks() {
    try {
      setDiskReq({ loading: true });
      const disks = await api.lvmhardDisksGet();
      setDisk(disks[0]);
      setDiskReq({ result: disks });
    } catch (e) {
      setDiskReq({ error: e });
      console.error("Error on lvmhardDiskGet", e);
    }
  }

  async function getVolumeGroups() {
    try {
      setVolumeGroupReq({ loading: true });
      const volumeGroups = await api.lvmVolumeGroupsGet();
      setVolumeGroup(volumeGroups[0]);
      setVolumeGroupReq({ result: volumeGroups });
    } catch (e) {
      setVolumeGroupReq({ error: e });
      console.error("Error on lvmVolumeGroupsGet", e);
    }
  }

  async function getLogicalVolumes() {
    try {
      setLogicalVolumeReq({ loading: true });
      const logicalVolumes = await api.lvmLogicalVolumesGet();
      setLogicalVolume(logicalVolumes[0]);
      setLogicalVolumeReq({ result: logicalVolumes });
    } catch (e) {
      setLogicalVolumeReq({ error: e });
      console.error("Error on lvmLogicalVolumesGet", e);
    }
  }

  async function expandDisk(
    disk: string,
    volumeGroup: string,
    logicalVolume: string
  ) {
    try {
      setExpandDiskReq({ loading: true });
      const logicalVolumes = await api.lvmDiskSpaceExtend({
        disk,
        volumeGroup,
        logicalVolume
      });
      setExpandDiskReq({ result: logicalVolumes });
    } catch (e) {
      setExpandDiskReq({ error: e });
      console.error("Error on lvmDiskSpaceExtend", e);
    }
  }

  return (
    <Card spacing>
      <div>
        <p>Expand the disk space of your dappnode</p>
        <Button onClick={() => setStart(!start)} variant="dappnode">
          Start
        </Button>
      </div>

      {/** FIRST STEP: select hard disk */}
      {start && (
        <>
          <div className="subtle-header">1. Select hard disk</div>
          <p>Check and select the hard disk to be added.</p>
          <Button onClick={getDisks}>Get hard disks</Button>
          {diskReq.result ? (
            <Select
              value={undefined}
              options={diskReq.result}
              onValueChange={(value: string) => setDisk(value)}
            />
          ) : diskReq.loading ? (
            <Ok msg="Getting hard disks" loading={true} />
          ) : diskReq.error ? (
            <ErrorView error={diskReq.error} red hideIcon />
          ) : null}
        </>
      )}
      {/** SECOND STEP: select volume group */}
      {disk && (
        <>
          <div className="subtle-header">2. Select Volume Group</div>
          <p>Select the Volume Group to be expanded.</p>
          <Button disabled={!disk} onClick={getVolumeGroups}>
            Get volume groups
          </Button>
          {volumeGroupReq.result ? (
            <Select
              value={undefined}
              options={volumeGroupReq.result}
              onValueChange={(value: string) => setVolumeGroup(value)}
            />
          ) : volumeGroupReq.loading ? (
            <Ok msg="Getting volumes groups" loading={true} />
          ) : volumeGroupReq.error ? (
            <ErrorView error={volumeGroupReq.error} red hideIcon />
          ) : null}
        </>
      )}

      {/** THIRD STEP: select logical volume */}
      {volumeGroup && (
        <>
          <div className="subtle-header">3. Select Logical Volume</div>
          <p>Select the Logical Volume to be expanded.</p>
          <Button disabled={!disk || !volumeGroup} onClick={getLogicalVolumes}>
            Get Logical Volumes
          </Button>
          {logicalVolumeReq.result ? (
            <Select
              value={undefined}
              options={logicalVolumeReq.result}
              onValueChange={(value: string) => setLogicalVolume(value)}
            />
          ) : logicalVolumeReq.loading ? (
            <Ok msg="Getting logical volumes" loading={true} />
          ) : logicalVolumeReq.error ? (
            <ErrorView error={logicalVolumeReq.error} red hideIcon />
          ) : null}
        </>
      )}

      {/** FORTH STEP: expand disk space */}
      {logicalVolume && (
        <>
          <div className="subtle-header">4. Expand disk space</div>
          <p>Expand the disk space with the selected options.</p>
          {disk && volumeGroup && logicalVolume ? (
            <>
              <p>
                Options selected: hard disk {disk}, Volume Group {volumeGroup}{" "}
                and Logical Volume {logicalVolume}
              </p>
              <Button
                onClick={() => expandDisk(disk, volumeGroup, logicalVolume)}
              >
                Expand disk
              </Button>
            </>
          ) : null}
        </>
      )}

      {expandDiskReq.result ? (
        <Ok msg={expandDiskReq.result} ok={true} />
      ) : expandDiskReq.loading ? (
        <Ok msg="Expanding disk space..." loading={true} />
      ) : expandDiskReq.error ? (
        <ErrorView error={expandDiskReq.error} red hideIcon />
      ) : null}
    </Card>
  );
}
