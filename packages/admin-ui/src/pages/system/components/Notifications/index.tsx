import React from "react";
import SubTitle from "components/SubTitle";
import { TelegramNotifications } from "./Telegram";
import EthicalMetrics from "./EthicalMetrics";
import "./notifications.scss";
import Pwa from "./Pwa";

export function Notifications() {
  return (
    <>
      <SubTitle>PWA</SubTitle>
      <Pwa />

      <SubTitle>Ethical metrics</SubTitle>
      <EthicalMetrics />

      <SubTitle>Telegram</SubTitle>
      <TelegramNotifications />
    </>
  );
}
