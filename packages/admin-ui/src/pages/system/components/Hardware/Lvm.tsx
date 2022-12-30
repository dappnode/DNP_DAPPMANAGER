import React, { useState } from "react";
import {
  HostLogicalVolume,
  HostHardDisk,
  HostVolumeGroup
} from "@dappnode/common";
import { api } from "api";
import Button from "components/Button";
import Ok from "components/Ok";
import ErrorView from "components/ErrorView";
import Select from "components/Select";
import Card from "components/Card";
import { dappnodeVolumeGroup, dappnodeLogicalVolume, forumUrl } from "params";
import LinkDocs from "components/LinkDocs";
import { confirm } from "components/ConfirmDialog";
import { ReqStatus } from "types";

export default function Lvm() {
  const [manual, setManual] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  // Requests
  const [diskReq, setDiskReq] = useState<ReqStatus<HostHardDisk[]>>({});
  const [volumeGroupReq, setVolumeGroupReq] = useState<
    ReqStatus<HostVolumeGroup[]>
  >({});
  const [logicalVolumeReq, setLogicalVolumeReq] = useState<
    ReqStatus<HostLogicalVolume[]>
  >({});
  const [expandDiskReq, setExpandDiskReq] = useState<ReqStatus<string>>({});

  // Select options
  const [disk, setDisk] = useState("");
  const [volumeGroup, setVolumeGroup] = useState("");
  const [logicalVolume, setLogicalVolume] = useState("");

  async function getDisks() {
    try {
      setDiskReq({ loading: true });
      const disks = await api.lvmhardDisksGet();
      setDisk(disks[0].name);
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
      setVolumeGroup(volumeGroups[0].vg_name);
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
      setLogicalVolume(logicalVolumes[0].lv_name);
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

  async function getDappnodeDefaults() {
    try {
      const volumeGroups = await api.lvmVolumeGroupsGet();
      const defaultVg = volumeGroups.find(
        vg => vg.vg_name === dappnodeVolumeGroup
      )?.vg_name;
      if (defaultVg) setVolumeGroup(defaultVg);
      else
        throw Error(
          `Dappnode default volume group ${dappnodeVolumeGroup} not found`
        );

      const logicalVolumes = await api.lvmLogicalVolumesGet();
      const defaultLv = logicalVolumes.find(
        lv => lv.lv_name === dappnodeLogicalVolume
      )?.lv_name;
      if (defaultLv) setLogicalVolume(defaultLv);
      else
        throw Error(
          `Dappnode default logical volume ${dappnodeLogicalVolume} not found`
        );
    } catch (e) {
      setExpandDiskReq({ error: e });
      console.error("Not possible to expand the disk space", e);
    }
  }

  function cleanValues(): void {
    setDisk("");
    setVolumeGroup("");
    setLogicalVolume("");
    setDiskReq({});
    setLogicalVolumeReq({});
    setVolumeGroupReq({});
    setExpandDiskReq({});
  }

  async function disclaimer(automatic: boolean) {
    await new Promise<void>(resolve =>
      confirm({
        title: `Are you sure you want to extend the host filesystem with another storage device?`,
        text: `Extending the filesystem is a dangerous operation that cannot be undone. You must very well know what you are doing.
      
You must read the DAppNode documentation about extending the filesystem with LVM. Contact support if you have any doubt about the process.`,
        label: "Extend filesystem",
        buttons: [
          {
            variant: "dappnode",
            label: "Cancel",
            onClick: () => resolve
          },
          {
            variant: "danger",
            label: "I understand, I want to extend the host filesystem",
            onClick: () => {
              if (automatic) {
                setAutomatic(true);
                setManual(false);
              } else {
                setAutomatic(false);
                setManual(true);
              }

              cleanValues();
            }
          }
        ]
      })
    );
  }

  return (
    <Card spacing>
      <div>
        <p>
          Expand your DAppNode filesystem with another storage device. More
          information at:{" "}
          <LinkDocs href={forumUrl.expandFileSystemHowTo}>
            How to expand your DAppNode filesystem
          </LinkDocs>
        </p>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <Button onClick={() => disclaimer(true)} variant="dappnode">
            Automatic expansion
          </Button>
          <Button onClick={() => disclaimer(false)} variant="outline-secondary">
            Manual expansion
          </Button>
        </div>
      </div>

      {/** FIRST STEP: select storage device */}
      {(automatic || manual) && (
        <>
          <hr />
          <div className="subtle-header">Select storage device</div>
          <p>Check and select the storage device to be added.</p>
          <Button onClick={getDisks}>Get storage devices</Button>
          {diskReq.result ? (
            <Select
              value={undefined}
              options={diskReq.result.map(
                disk => `${disk.name} (${disk.size})`
              )}
              onValueChange={(value: string) => setDisk(value.split(/\s+/)[0])}
            />
          ) : diskReq.loading ? (
            <Ok msg="Getting storage devices" loading={true} />
          ) : diskReq.error ? (
            <ErrorView error={diskReq.error} red hideIcon />
          ) : null}
        </>
      )}

      {/** AUTOMATIC STEPS: select volume group and logical volume*/}
      {automatic && disk && (
        <>
          <hr />
          <div className="subtle-header">Get default dappnode values</div>
          <p>Select the Volume Group to be expanded.</p>
          <Button disabled={!disk} onClick={getDappnodeDefaults}>
            Get default values
          </Button>
        </>
      )}

      {/** SECOND STEP: select volume group */}
      {manual && disk && (
        <>
          <hr />
          <div className="subtle-header">Select Volume Group</div>
          <p>Select the Volume Group to be expanded.</p>
          <Button disabled={!disk} onClick={getVolumeGroups}>
            Get volume groups
          </Button>
          {volumeGroupReq.result ? (
            <Select
              value={undefined}
              options={volumeGroupReq.result.map(
                vg => `${vg.vg_name} (${vg.vg_size})`
              )}
              onValueChange={(value: string) =>
                setVolumeGroup(value.split(/\s+/)[0])
              }
            />
          ) : volumeGroupReq.loading ? (
            <Ok msg="Getting volumes groups" loading={true} />
          ) : volumeGroupReq.error ? (
            <ErrorView error={volumeGroupReq.error} red hideIcon />
          ) : null}
        </>
      )}

      {/** THIRD STEP: select logical volume */}
      {manual && volumeGroup && (
        <>
          <hr />
          <div className="subtle-header">Select Logical Volume</div>
          <p>Select the Logical Volume to be expanded.</p>
          <Button disabled={!disk || !volumeGroup} onClick={getLogicalVolumes}>
            Get Logical Volumes
          </Button>
          {logicalVolumeReq.result ? (
            <Select
              value={undefined}
              options={logicalVolumeReq.result.map(
                lv => `${lv.lv_name} (${lv.lv_size}) (${lv.vg_name})`
              )}
              onValueChange={(value: string) =>
                setLogicalVolume(value.split(/\s+/)[0])
              }
            />
          ) : logicalVolumeReq.loading ? (
            <Ok msg="Getting logical volumes" loading={true} />
          ) : logicalVolumeReq.error ? (
            <ErrorView error={logicalVolumeReq.error} red hideIcon />
          ) : null}
        </>
      )}

      {/** FORTH STEP: expand disk space */}
      {(manual || automatic) && logicalVolume && (
        <>
          <hr />
          <div className="subtle-header">Expand disk space</div>
          <p>Expand the disk space with the selected options.</p>
          {disk && volumeGroup && logicalVolume ? (
            <>
              <p>
                Options selected:
                <ul>
                  <li key={disk}>Storage device: {disk}</li>
                  <li key={logicalVolume}>Volume Group: {volumeGroup}</li>
                  <li key={volumeGroup}>Logical Volume: {logicalVolume}</li>
                </ul>
              </p>
              <Button
                onClick={() => expandDisk(disk, volumeGroup, logicalVolume)}
              >
                Expand host filesystem
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
