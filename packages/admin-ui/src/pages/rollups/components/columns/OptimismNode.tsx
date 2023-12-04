import React from "react";
import { OptimismItem, OptimismItemOk } from "@dappnode/common";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";

export default function OptimismNode({
  rollup,
  setNewRollup,
  isSelected,
  ...props
}: {
  rollup: OptimismItem<"rollup">;
  setNewRollup: React.Dispatch<
    React.SetStateAction<OptimismItemOk<"rollup"> | undefined>
  >;
  isSelected: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card
      {...props}
      className={`optimism-node ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
    >
      <div
        onClick={
          rollup.status === "ok"
            ? isSelected
              ? () => setNewRollup(undefined)
              : () => setNewRollup(rollup)
            : undefined
        }
      >
        {rollup.status === "ok" ? (
          <div className="avatar">
            <img src={rollup.avatarUrl || defaultAvatar} alt="avatar" />
          </div>
        ) : rollup.status === "error" ? (
          <div className="avatar">
            <img src={errorAvatar} alt="avatar" />
          </div>
        ) : null}

        <div className="title">{prettyDnpName(rollup.dnpName)} </div>
      </div>

      {rollup.status === "ok" &&
        isSelected &&
        rollup.isInstalled &&
        !rollup.isUpdated && (
          <>
            <Button
              onClick={() =>
                navigate(
                  `${getInstallerPath(rollup.dnpName)}/${rollup.dnpName}`
                )
              }
              variant="dappnode"
            >
              UPDATE
            </Button>
            <br />
            <br />
          </>
        )}

      {rollup.status === "ok" && (
        <div className="description">
          {isSelected && rollup.data?.manifest?.shortDescription}
        </div>
      )}
    </Card>
  );
}
