import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { InputForm } from "components/InputForm";
import { joinCssClass } from "utils/css";
import { Network, StakerItem, StakerItemOk } from "@dappnode/common";
import "./columns.scss";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { rootPath as installedRootPath } from "pages/installer";
import { Link } from "react-router-dom";
import { Alert } from "react-bootstrap";

export default function ConsensusClient<T extends Network>({
  consensusClient,
  setNewConsClient,
  newConsClient,
  isSelected,
  feeRecipientError,
  graffitiError,
  defaultGraffiti,
  defaultFeeRecipient,
  defaultCheckpointSync,
  ...props
}: {
  consensusClient: StakerItem<T, "consensus">;
  setNewConsClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "consensus"> | undefined>
  >;
  newConsClient: StakerItemOk<T, "consensus"> | undefined;
  isSelected: boolean;
  feeRecipientError: string | null;
  graffitiError: string | null;
  defaultGraffiti: string;
  defaultFeeRecipient: string;
  defaultCheckpointSync: string;
}) {
  return (
    <Card
      {...props}
      className={`consensus-client ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
    >
      <div
        onClick={
          consensusClient.status === "ok"
            ? isSelected
              ? () => setNewConsClient(undefined)
              : () =>
                  setNewConsClient({
                    ...consensusClient,
                    graffiti: consensusClient.graffiti || defaultGraffiti,
                    feeRecipient:
                      consensusClient.feeRecipient || defaultFeeRecipient,
                    checkpointSync:
                      consensusClient.checkpointSync || defaultCheckpointSync
                  })
            : undefined
        }
      >
        {consensusClient.status === "ok" ? (
          <div className="avatar">
            <img
              src={consensusClient.avatarUrl || defaultAvatar}
              alt="avatar"
            />
          </div>
        ) : consensusClient.status === "error" ? (
          <div className="avatar">
            <img src={errorAvatar} alt="avatar" />
          </div>
        ) : null}

        <div className="title">{prettyDnpName(consensusClient.dnpName)}</div>
      </div>

      {consensusClient.status === "ok" &&
        isSelected &&
        consensusClient.isInstalled &&
        !consensusClient.isUpdated && (
          <>
            <Link to={`${installedRootPath}/${consensusClient.dnpName}`}>
              <Button variant="dappnode">UPDATE</Button>
            </Link>
            <br />
            <br />
          </>
        )}

      {consensusClient.status === "ok" && (
        <div className="description">
          {isSelected &&
            consensusClient.data &&
            consensusClient.data.metadata.shortDescription}
        </div>
      )}

      {isSelected &&
        consensusClient.dnpName ===
          "gnosis-beacon-chain-prysm.dnp.dappnode.eth" && (
          <Alert variant="warning">
            It is <b>not recommended</b> to use <b>Prysm</b> as a consensus
            client <b>in Gnosis</b>. Use it at your own risk or change to
            another alternative.
          </Alert>
        )}

      {isSelected && newConsClient && (
        <>
          <hr />
          <InputForm
            fields={[
              {
                label: "Fee recipient address",
                labelId: "fee-recipient-address",
                name: "fee-recipient-address",
                autoComplete: "fee-recipient-address",
                secret: false,
                value: newConsClient.feeRecipient || "",
                onValueChange: (value: string) =>
                  setNewConsClient({ ...newConsClient, feeRecipient: value }),
                error: feeRecipientError
              },
              {
                label: "Graffiti",
                labelId: "graffiti",
                name: "graffiti",
                autoComplete: "validating_from_DAppNode",
                secret: false,
                value: newConsClient.graffiti || "",
                onValueChange: (value: string) =>
                  setNewConsClient({ ...newConsClient, graffiti: value }),
                error: graffitiError
              },
              {
                label: "Checkpoint sync",
                labelId: "checkpoint-sync",
                name: "checkpoint-sync",
                autoComplete: "checkpoint-sync",
                secret: false,
                value: newConsClient.checkpointSync || "",
                onValueChange: (value: string) =>
                  setNewConsClient({
                    ...newConsClient,
                    checkpointSync: value
                  }),
                error: null
              }
            ]}
          />
        </>
      )}
    </Card>
  );
}
