import React from "react";
import SubTitle from "components/SubTitle";

// import PushNotisPremium from "./PushNotisPremium";
import { PwaRequirementsCheck } from "./PwaRequirementsCheck";

export default function App() {
  return (
    <>
      <SubTitle>Dappnode App</SubTitle>
      <PwaRequirementsCheck />
      {/* <PushNotisPremium /> */}
    </>
  );
}
