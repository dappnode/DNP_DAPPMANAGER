import React from "react";
import Card from "components/Card";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { prettyDnpName } from "utils/format";

export default function MevBoost({
  mevBoost,
  setInstallMevBoost,
  isInstalled
}: {
  mevBoost: string;
  setInstallMevBoost: (installMevBoost: boolean) => void;
  isInstalled: boolean;
}) {
  return (
    <Card onClick={() => setInstallMevBoost(true)} shadow={isInstalled}>
      <p>{prettyDnpName(mevBoost)}</p>
      {isInstalled ? <BsCircleFill /> : <BsCircle />} Installed
    </Card>
  );
}
