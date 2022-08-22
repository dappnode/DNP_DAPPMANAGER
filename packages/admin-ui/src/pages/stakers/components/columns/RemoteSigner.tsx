import React from "react";
import Card from "components/Card";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { prettyDnpName } from "utils/format";

export default function RemoteSigner({
  signer,
  setEnableWeb3signer,
  enableWeb3signer
}: {
  signer: string;
  setEnableWeb3signer: (installWeb3signer: boolean) => void;
  enableWeb3signer: boolean;
}) {
  return (
    <Card
      onClick={() => setEnableWeb3signer(!enableWeb3signer)}
      shadow={enableWeb3signer}
    >
      <p>{prettyDnpName(signer)}</p>
      {enableWeb3signer ? <BsCircleFill /> : <BsCircle />} Enabled <br />
    </Card>
  );
}
