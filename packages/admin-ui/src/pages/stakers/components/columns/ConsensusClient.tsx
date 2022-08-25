import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { InputForm } from "components/InputForm";
import { joinCssClass } from "utils/css";
import "./columns.scss";

export default function ConsensusClient({
  consensusClient,
  setNewConsClient,
  isInstalled,
  isSelected,
  graffiti,
  setNewGraffiti,
  feeRecipient,
  setNewFeeRecipient,
  checkpointSync,
  setNewCheckpointSync
}: {
  consensusClient: string;
  setNewConsClient: (consensusClient: string) => void;
  isInstalled: boolean;
  isSelected: boolean;
  graffiti?: string;
  setNewGraffiti: (newGraffiti: string) => void;
  feeRecipient?: string;
  setNewFeeRecipient: (newFeeRecipient: string) => void;
  checkpointSync?: string;
  setNewCheckpointSync: (newCheckpointSync: string) => void;
}) {
  const feeRecipientError = validateEthereumAddress(feeRecipient);
  const graffitiError = validateGraffiti(graffiti);

  return (
    <Card
      className={`consensus-client ${joinCssClass({ isSelected })}`}
      onClick={() => setNewConsClient(consensusClient)}
      shadow={isSelected}
    >
      <div className="title">{prettyDnpName(consensusClient)}</div>
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
                value: feeRecipient || "",
                onValueChange: (value: string) => setNewFeeRecipient(value),
                error: feeRecipientError
              },
              {
                label: "Graffiti",
                labelId: "graffiti",
                name: "graffiti",
                autoComplete: "validating_from_DAppNode",
                secret: false,
                value: graffiti || "",
                onValueChange: (value: string) => setNewGraffiti(value),
                error: graffitiError
              },
              {
                label: "Checkpoint sync",
                labelId: "checkpoint-sync",
                name: "checkpoint-sync",
                autoComplete: "checkpoint-sync",
                secret: false,
                value: checkpointSync || "",
                onValueChange: (value: string) => setNewCheckpointSync(value),
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
