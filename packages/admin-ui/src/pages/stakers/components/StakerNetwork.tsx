import React from "react";
import SubTitle from "components/SubTitle";
import Card from "components/Card";

export default function StakerNetwork({
  network,
  description,
  executionClients,
  consensusClients,
  signers,
  mevBoost
}: {
  network: string;
  description: string;
  executionClients: string[];
  consensusClients: string[];
  signers: string[];
  mevBoost?: string[];
}) {
  return (
    <>
      <Card>
        <SubTitle>{description}</SubTitle>
      </Card>
    </>
  );
}
