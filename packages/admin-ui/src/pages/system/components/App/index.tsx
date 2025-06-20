import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { PwaRequirements } from "./PwaRequirements";

import PushNotisPremium from "./PushNotisPremium";

export default function App() {
  return (
    <>
      <SubTitle>Dappnode App</SubTitle>
      <Card spacing>
        <div>Download the Dappnode App for seamless access to the DappManager UI across all your devices.</div>
      </Card>
      <PwaRequirements />

      <PushNotisPremium />
    </>
  );
}
