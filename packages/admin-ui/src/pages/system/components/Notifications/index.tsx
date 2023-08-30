import React from "react";
import SubTitle from "components/SubTitle";
import { TelegramNotifications } from "./Telegram";
import EthicalMetrics from "./EthicalMetrics";

export function Notifications() {
  return (
    <>
      <SubTitle>Ethical metrics</SubTitle>
      <EthicalMetrics />

      <SubTitle>Telegram</SubTitle>
      <TelegramNotifications />
    </>
  );
}
