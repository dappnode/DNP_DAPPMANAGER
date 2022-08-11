import React from "react";
import Card from "components/Card";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { prettyDnpName } from "utils/format";

export default function RemoteSigner({
  signer,
  setInstallWeb3signer,
  isInstalled
}: {
  signer: string;
  setInstallWeb3signer: (installWeb3signer: boolean) => void;
  isInstalled: boolean;
}) {
  return (
    <Card onClick={() => setInstallWeb3signer(true)} shadow={isInstalled}>
      <p>{prettyDnpName(signer)}</p>
      {isInstalled ? <BsCircleFill /> : <BsCircle />} Installed
    </Card>
  );
}
