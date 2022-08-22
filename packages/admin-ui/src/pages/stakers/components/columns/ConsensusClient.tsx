import React from "react";
import Card from "components/Card";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { prettyDnpName } from "utils/format";
import { InputForm } from "components/InputForm";

export default function ConsensusClient({
  consensusClient,
  setNewConsClient,
  isInstalled,
  isSelected,
  graffiti,
  setNewGraffiti,
  feeRecipient,
  setNewFeeRecipient
}: {
  consensusClient: string;
  setNewConsClient: (consensusClient: string) => void;
  isInstalled: boolean;
  isSelected: boolean;
  graffiti?: string;
  setNewGraffiti: (newGraffiti: string) => void;
  feeRecipient?: string;
  setNewFeeRecipient: (newFeeRecipient: string) => void;
}) {
  const feeRecipientError = validateEthereumAddress(feeRecipient);
  const graffitiError = validateGraffiti(graffiti);

  return (
    <Card onClick={() => setNewConsClient(consensusClient)} shadow={isSelected}>
      <p>{prettyDnpName(consensusClient)}</p>
      {isInstalled ? <BsCircleFill /> : <BsCircle />} Installed <br />
      {isSelected ? <BsCircleFill /> : <BsCircle />} Selected
      {isSelected && isInstalled && (
        <>
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
