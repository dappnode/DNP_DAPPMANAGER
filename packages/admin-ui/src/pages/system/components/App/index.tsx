import React from "react";
import SubTitle from "components/SubTitle";

// import PushNotisPremium from "./PushNotisPremium";
import { PwaRequirementsCheck } from "./PwaRequirementsCheck";
import Card from "components/Card";

export default function App() {
  return (
    <>
      <SubTitle>Dappnode App</SubTitle>
      <Card>
        The Dappnode app allows you to connect to the Dappmanager in mobile or desktop and receive notifications.
      </Card>
      <PwaRequirementsCheck />
      {/* <PushNotisPremium /> */}
    </>
  );
}
