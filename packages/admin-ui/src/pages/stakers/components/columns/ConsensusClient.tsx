import React from "react";
import Card from "components/Card";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { prettyDnpName } from "utils/format";
import Input from "components/Input";

export default function ConsensusClient({
  consensusClient,
  setNewConsClient,
  isInstalled,
  isSelected,
  currentGraffiti,
  setNewGraffiti,
  currentFeeRecipient,
  setNewFeeRecipient
}: {
  consensusClient: string;
  setNewConsClient: (consensusClient: string) => void;
  isInstalled: boolean;
  isSelected: boolean;
  currentGraffiti?: string;
  setNewGraffiti: (newGraffiti: string) => void;
  currentFeeRecipient?: string;
  setNewFeeRecipient: (newFeeRecipient: string) => void;
}) {
  return (
    <Card onClick={() => setNewConsClient(consensusClient)} shadow={isSelected}>
      <p>{prettyDnpName(consensusClient)}</p>
      {isInstalled ? <BsCircleFill /> : <BsCircle />} Installed <br />
      {isSelected ? <BsCircleFill /> : <BsCircle />} Selected
      {isSelected && isInstalled && (
        <>
          <Input
            value={currentFeeRecipient || ""}
            onValueChange={setNewFeeRecipient}
          />
          <Input value={currentGraffiti || ""} onValueChange={setNewGraffiti} />
        </>
      )}
    </Card>
  );
}
