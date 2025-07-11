import React from "react";
import { DevicesSubs } from "./DevicesSubs";
import { PwaRequirementsWrapper } from "components/PwaRequirementsWrapper";
import SubTitle from "components/SubTitle";

export function Subscriptions() {
  return (
    <div className="subscriptions-container">
      <SubTitle>Device Subscriptions</SubTitle>
      <p>Manage your device subscriptions for push notifications. <b>TODO: Learn more in docs</b></p>
      <PwaRequirementsWrapper
        successComponent={<DevicesSubs />}
        handleRedirectMessage="To manage devices' subscriptions, you will be redirected to a different secure domain. Please, login with your current
              Dappnode credentials."
      />
    </div>
  );
}
