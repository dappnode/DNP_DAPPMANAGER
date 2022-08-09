import React from "react";
import Card from "components/Card";

export default function MevBoost({
  mevBoost,
  isInstalled
}: {
  mevBoost: string;
  isInstalled: boolean;
}) {
  return (
    <Card>
      <p>{mevBoost}</p>
    </Card>
  );
}
