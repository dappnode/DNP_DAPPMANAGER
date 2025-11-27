import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem, StakerItemOk } from "@dappnode/types";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";
import { Alert } from "react-bootstrap";

export default function ConsensusClient({
  consensusClient,
  setNewConsClient,
  isSelected,
  ...props
}: {
  consensusClient: StakerItem;
  setNewConsClient: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  isSelected: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card {...props} className={`consensus-client ${joinCssClass({ isSelected })}`} shadow={isSelected}>
      <div
        onClick={
          consensusClient.status === "ok"
            ? isSelected
              ? () => {
                  setNewConsClient(null);
                }
              : () => {
                  setNewConsClient(consensusClient);
                }
            : undefined
        }
      >
        {consensusClient.status === "ok" ? (
          <div className="avatar">
            <img src={consensusClient.avatarUrl || defaultAvatar} alt="avatar" />
          </div>
        ) : consensusClient.status === "error" ? (
          <div className="avatar">
            <img src={errorAvatar} alt="avatar" />
          </div>
        ) : null}

        <div className="title">{prettyDnpName(consensusClient.dnpName)}</div>
      </div>

      {consensusClient.status === "ok" && isSelected ? (
        <>
          {consensusClient.isInstalled && !consensusClient.isUpdated && (
            <>
              <Button
                onClick={() => navigate(`${getInstallerPath(consensusClient.dnpName)}/${consensusClient.dnpName}`)}
                variant="dappnode"
              >
                UPDATE
              </Button>
            </>
          )}
        </>
      ) : null}

      {isSelected &&
        // cast to any as long as the gnosis prysm was deprecated
        (consensusClient.dnpName as string) === "gnosis-beacon-chain-prysm.dnp.dappnode.eth" && (
          <Alert variant="warning">
            It is <b>not recommended</b> to use <b>Prysm</b> as a consensus client <b>in Gnosis</b>. Use it at your own
            risk or change to another alternative.
          </Alert>
        )}
    </Card>
  );
}
