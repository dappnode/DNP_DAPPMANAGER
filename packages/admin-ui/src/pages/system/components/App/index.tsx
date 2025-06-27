import React from "react";
import SubTitle from "components/SubTitle";

// import PushNotisPremium from "./PushNotisPremium";
import { PwaRequirementsCheck } from "./PwaRequirementsCheck";
import Card from "components/Card";

export default function App() {
  return (
    <>
      <SubTitle>Dappnode App</SubTitle>
      <Card>The Dappnode App allows you to connect to the dappmanager directly as a mobile / desktop application</Card>
      <PwaRequirementsCheck />
      {/* <PushNotisPremium /> */}
    </>
  );
}
