import React from "react";
import SubTitle from "components/SubTitle";
import Card from "components/Card";
import { PwaInstallCards } from "./PwaInstallCards";
import { PwaRequirementsWrapper } from "components/PwaRequirementsWrapper";
import LinkDocs from "components/LinkDocs";
import { docsUrl } from "params";

export default function App() {
  return (
    <>
      <SubTitle>Dappnode App</SubTitle>
      <Card>
        The Dappnode app allows you to connect to the Dappmanager in mobile or desktop and receive notifications.{" "}
        <LinkDocs href={docsUrl.pwaHowToInstall}>Check installation guide.</LinkDocs>
      </Card>
      <PwaRequirementsWrapper
        successComponent={<PwaInstallCards />}
        handleRedirectMessage="To install the app, you will be redirected to a different secure domain. Please, login with your current
              Dappnode credentials."
      />
    </>
  );
}
