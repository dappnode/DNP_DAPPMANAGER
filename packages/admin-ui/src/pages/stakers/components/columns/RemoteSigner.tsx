import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import "./columns.scss";

export default function RemoteSigner({
  signer,
  setEnableWeb3signer,
  isSelected
}: {
  signer: string;
  setEnableWeb3signer: (installWeb3signer: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      className={`remote-signer ${joinCssClass({ isSelected })}`}
      onClick={() => setEnableWeb3signer(!isSelected)}
      shadow={isSelected}
    >
      <div className="title">{prettyDnpName(signer)}</div>
    </Card>
  );
}
