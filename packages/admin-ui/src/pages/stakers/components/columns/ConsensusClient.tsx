import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { InputForm } from "components/InputForm";
import { joinCssClass } from "utils/css";
import { ConsensusClient as ConsensusClientIface, Network } from "types";
import "./columns.scss";

export default function ConsensusClient({
  consensusClient,
  setNewConsClient,
<<<<<<< HEAD
=======
  isInstalled,
>>>>>>> c760b2dc (ad de-select options)
  isSelected,
  network
}: {
  consensusClient: ConsensusClientIface;
  setNewConsClient: React.Dispatch<
    React.SetStateAction<ConsensusClientIface | undefined>
  >;
  isSelected: boolean;
  network: Network;
}) {
  const feeRecipientError = validateEthereumAddress(
    consensusClient.feeRecipient
  );
  const graffitiError = validateGraffiti(consensusClient.graffiti);
  const checkpointSyncPlaceHolder =
    network === "mainnet"
      ? "https://checkpoint-sync.dappnode.io/"
      : network === "prater"
      ? "https://checkpoint-sync-prater.dappnode.io/"
      : "";

  return (
    <Card
      className={`consensus-client ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
    >
      <div
        className="title"
        onClick={
          isSelected
            ? () => setNewConsClient({ dnpName: "" })
            : () => setNewConsClient(consensusClient)
        }
      >
        {prettyDnpName(consensusClient.dnpName)}
      </div>
      {isSelected && (
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
                value: consensusClient.feeRecipient || "",
                onValueChange: (value: string) =>
                  setNewConsClient({ ...consensusClient, feeRecipient: value }),
                error: feeRecipientError
              },
              {
                label: "Graffiti",
                labelId: "graffiti",
                name: "graffiti",
                autoComplete: "validating_from_DAppNode",
                secret: false,
                value: consensusClient.graffiti || "",
                onValueChange: (value: string) =>
                  setNewConsClient({ ...consensusClient, graffiti: value }),
                error: graffitiError
              },
              {
                label: "Checkpoint sync",
                labelId: "checkpoint-sync",
                name: "checkpoint-sync",
                autoComplete: "checkpoint-sync",
                placeholder: checkpointSyncPlaceHolder,
                secret: false,
                value: consensusClient.checkpointSync || "",
                onValueChange: (value: string) =>
                  setNewConsClient({
                    ...consensusClient,
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

// Utils

function validateEthereumAddress(value?: string): string | null {
  if (value && !/^0x[0-9a-fA-F]{40}$/.test(value)) return "Invalid address";
  return null;
}

function validateGraffiti(value?: string): string | null {
  // It must be not more than 32 characters long
  if (value && value.length > 32)
    return "Graffiti must be less than 32 characters";
  return null;
}
