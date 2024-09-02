import React from "react";
import { OptimismItem, OptimismItemOk } from "@dappnode/types";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";

export default function LegacyGeth({
  archive,
  setNewArchive,
  isSelected,
  ...props
}: {
  archive: OptimismItem<"archive">;
  setNewArchive: React.Dispatch<React.SetStateAction<OptimismItemOk<"archive"> | undefined>>;
  isSelected: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card
      {...props}
      className={`legacy-geth ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
      onClick={
        archive.status === "ok"
          ? isSelected
            ? () => setNewArchive(undefined)
            : () => setNewArchive(archive)
          : undefined
      }
    >
      {archive.status === "ok" ? (
        <div className="avatar">
          <img src={archive.avatarUrl || defaultAvatar} alt="avatar" />
        </div>
      ) : archive.status === "error" ? (
        <div className="avatar">
          <img src={errorAvatar} alt="avatar" />
        </div>
      ) : null}

      <div className="title">{prettyDnpName(archive.dnpName)} </div>

      {archive.status === "ok" && isSelected && archive.isInstalled && !archive.isUpdated && (
        <>
          <Button
            onClick={() => navigate(`${getInstallerPath(archive.dnpName)}/${archive.dnpName}`)}
            variant="dappnode"
          >
            UPDATE
          </Button>
          <br />
          <br />
        </>
      )}

      {archive.status === "ok" && (
        <div className="description">{isSelected && archive.data?.manifest?.shortDescription}</div>
      )}
    </Card>
  );
}
