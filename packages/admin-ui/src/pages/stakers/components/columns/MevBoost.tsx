import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import "./columns.scss";

export default function MevBoost({
  mevBoost,
  setEnableMevBoost,
  isSelected
}: {
  mevBoost: string;
  setEnableMevBoost: (installMevBoost: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      className={`mev-boost ${joinCssClass({ isSelected })}`}
      onClick={() => setEnableMevBoost(!isSelected)}
      shadow={isSelected}
    >
      <div className="title">{prettyDnpName(mevBoost)}</div>
    </Card>
  );
}
