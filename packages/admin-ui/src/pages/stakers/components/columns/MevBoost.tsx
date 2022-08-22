import React from "react";
import Card from "components/Card";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { prettyDnpName } from "utils/format";

export default function MevBoost({
  mevBoost,
  setEnableMevBoost,
  isInstalled,
  enableMevBoost
}: {
  mevBoost: string;
  setEnableMevBoost: (installMevBoost: boolean) => void;
  isInstalled: boolean;
  enableMevBoost: boolean;
}) {
  return (
    <Card
      onClick={() => setEnableMevBoost(!enableMevBoost)}
      shadow={enableMevBoost}
    >
      <p>{prettyDnpName(mevBoost)}</p>
      {isInstalled ? <BsCircleFill /> : <BsCircle />} Installed <br />
      {enableMevBoost ? <BsCircleFill /> : <BsCircle />} Enabled
    </Card>
  );
}
