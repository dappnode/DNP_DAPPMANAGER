import { Network, StakerItemOk } from "@dappnode/common";
import React from "react";

export default function MevBoostSelect<T extends Network>({
  mevBoost
}: {
  mevBoost: StakerItemOk<T, "mev-boost">;
}) {
  return <div>MevBoostSelect</div>;
}
