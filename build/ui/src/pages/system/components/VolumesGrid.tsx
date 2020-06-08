import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import Card from "components/Card";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Badge from "react-bootstrap/Badge";
import { MdExpandMore, MdExpandLess, MdDelete } from "react-icons/md";
import { MountpointDataView } from "components/SetupWizard/SelectMountpoint";
import { rootPath as packagesRootPath } from "pages/packages/data";
import {
  getPrettyVolumeName,
  getPrettyVolumeOwner,
  prettyBytes
} from "utils/format";
import { parseStaticDate } from "utils/dates";
import { joinCssClass } from "utils/css";
import { VolumeData } from "types";
// Selectors
import { getVolumes } from "services/dappnodeStatus/selectors";
// Actions
import { volumeRemove, packageVolumeRemove } from "../actions";

import "./volumes.scss";

const shortLength = 3;
const minSize = 10 * 1024 * 1024;

export default function VolumesGrid() {
  const volumes = useSelector(getVolumes);
  const dispatch = useDispatch();

  const [showAll, setShowAll] = useState(false);

  console.log({ volumes });

  const getSize = (v: VolumeData) => v.size || (v.fileSystem || {}).used || 0;
  const volumesFiltered = [...volumes]
    .sort((v1, v2) => getSize(v2) - getSize(v1))
    .sort((v1, v2) => (v1.isOrphan && !v2.isOrphan ? -1 : 1))
    .filter(v => showAll || getSize(v) > minSize)
    .slice(0, showAll ? volumes.length : shortLength);

  // Optimize the view hidding features when no element is using them
  const showRemove = showAll || volumesFiltered.some(v => v.isOrphan);
  const showMountpoint = showAll || volumesFiltered.some(v => v.mountpoint);

  return (
    <Card
      className={
        "list-grid volumes " + joinCssClass({ showRemove, showMountpoint })
      }
    >
      <header>Name</header>
      <header className="center">Size</header>
      {showMountpoint && <header className="center">Mountpoint</header>}
      <header className="center">Created at</header>
      {showRemove && <header>Remove</header>}

      {volumesFiltered.map(volData => {
        const { name, owner, size, fileSystem, createdAt, isOrphan } = volData;
        const ownerPretty = getPrettyVolumeOwner(volData);
        const namePretty = getPrettyVolumeName(volData);
        const onDelete = isOrphan
          ? () => dispatch(volumeRemove(name))
          : owner
          ? () => dispatch(packageVolumeRemove(owner, name))
          : () => {};
        const isDeletable = Boolean(isOrphan || owner);

        return (
          <React.Fragment key={name}>
            <div className="name">
              <span className="text">
                {owner ? (
                  <NavLink
                    className="owner"
                    to={`${packagesRootPath}/${owner}`}
                  >
                    {ownerPretty}
                  </NavLink>
                ) : ownerPretty ? (
                  <span className="owner">{ownerPretty}</span>
                ) : null}

                {ownerPretty && <span className="separator">-</span>}

                <span className="volName">{namePretty}</span>
              </span>
              {isOrphan && (
                <Badge pill variant="danger">
                  Orphan
                </Badge>
              )}
            </div>
            <div className="size">
              {!size && fileSystem ? (
                <OverlayTrigger
                  placement="right"
                  overlay={(props: any) => (
                    <Tooltip {...props}>
                      Can't get the exact volume size, use the mountpoint total
                      size as an approximate upper reference
                    </Tooltip>
                  )}
                >
                  <span className="opacity-soft">N/A</span>
                </OverlayTrigger>
              ) : (
                prettyBytes(size || 0)
              )}
            </div>
            {showMountpoint &&
              (fileSystem ? (
                <MountpointDataView
                  fileSystem={fileSystem}
                ></MountpointDataView>
              ) : (
                "Docker volume"
              ))}
            <div className="created-at">{parseStaticDate(createdAt, true)}</div>
            {showRemove && (
              <MdDelete
                className={isDeletable ? "" : "disabled"}
                onClick={onDelete}
              />
            )}
            <hr />
          </React.Fragment>
        );
      })}
      <div className="subtle-header" onClick={() => setShowAll(x => !x)}>
        {showAll ? <MdExpandLess /> : <MdExpandMore />}
        <span>Show {showAll ? "less" : "all"}</span>
      </div>
    </Card>
  );
}
